<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../helpers/Mailer.php';
require_once __DIR__ . '/../helpers/OrderEmail.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$userId = Auth::userId();
$input = Validator::getInput();

$v = new Validator($input);
$v->required('razorpay_order_id', 'Razorpay order ID')
  ->required('razorpay_payment_id', 'Razorpay payment ID')
  ->required('razorpay_signature', 'Razorpay signature')
  ->required('addressId', 'Shipping address');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

// Verify Razorpay signature
$keySecret = Env::get('RSECRET');
if (!$keySecret) {
    Response::error('Payment gateway not configured', 500);
}

$expectedSignature = hash_hmac(
    'sha256',
    $input['razorpay_order_id'] . '|' . $input['razorpay_payment_id'],
    $keySecret
);

if (!hash_equals($expectedSignature, $input['razorpay_signature'])) {
    // Log the failure for forensics (non-blocking)
    try {
        $db = Database::getInstance();
        $logStmt = $db->prepare('UPDATE hjk_payment_logs SET status = ?, razorpay_payment_id = ?, razorpay_signature = ?, error_message = ?, response_payload = ?, updated_at = NOW() WHERE razorpay_order_id = ?');
        $logStmt->execute([
            'signature_failed',
            $input['razorpay_payment_id'],
            $input['razorpay_signature'],
            'Signature mismatch on verify',
            json_encode($input),
            $input['razorpay_order_id'],
        ]);
    } catch (Exception $e) { error_log('Payment log signature_failed: ' . $e->getMessage()); }
    Response::error('Payment verification failed. Signature mismatch.', 400);
}

// Payment verified — now create the order (same logic as orders/create.php)
$db = Database::getInstance();

// Get user's cart items
$cartStmt = $db->prepare('
    SELECT ci.*, p.name AS product_name, p.is_active,
        pv.color, pv.color_hex,
        vs.selling_price, vs.stock,
        (SELECT vi.image_url FROM hjk_variant_images vi WHERE vi.variant_id = pv.id ORDER BY vi.sort_order LIMIT 1) AS image
    FROM hjk_cart_items ci
    JOIN hjk_products p ON p.id = ci.product_id
    JOIN hjk_product_variants pv ON pv.id = ci.variant_id
    JOIN hjk_variant_sizes vs ON vs.variant_id = ci.variant_id AND vs.size = ci.size
    WHERE ci.user_id = ?
');
$cartStmt->execute([$userId]);
$cartItems = $cartStmt->fetchAll();

if (empty($cartItems)) {
    Response::error('Your cart is empty');
}

// Validate address
$addrStmt = $db->prepare('SELECT * FROM hjk_addresses WHERE id = ? AND user_id = ?');
$addrStmt->execute([(int)$input['addressId'], $userId]);
$address = $addrStmt->fetch();
if (!$address) {
    Response::error('Invalid shipping address');
}

// Calculate totals
$subtotal = 0;
foreach ($cartItems as $item) {
    if (!$item['is_active']) {
        Response::error('Product "' . $item['product_name'] . '" is no longer available');
    }
    if ($item['stock'] < $item['quantity']) {
        Response::error('Insufficient stock for "' . $item['product_name'] . '". Available: ' . $item['stock']);
    }
    $subtotal += $item['selling_price'] * $item['quantity'];
}

// Coupon discount
$discount = 0;
$couponCode = '';
$couponId = null;
if (!empty($input['couponCode'])) {
    $couponCode = strtoupper(trim($input['couponCode']));
    $cStmt = $db->prepare('SELECT * FROM hjk_coupons WHERE code = ? AND is_active = 1');
    $cStmt->execute([$couponCode]);
    $coupon = $cStmt->fetch();

    if ($coupon) {
        $now = date('Y-m-d H:i:s');
        $valid = true;
        if ($coupon['valid_until'] && $now > $coupon['valid_until']) $valid = false;
        if ($coupon['usage_limit'] > 0 && $coupon['used_count'] >= $coupon['usage_limit']) $valid = false;
        if ($subtotal < $coupon['min_order_amount']) $valid = false;

        if ($valid) {
            $couponId = $coupon['id'];
            if ($coupon['type'] === 'percentage') {
                $discount = ($subtotal * $coupon['value']) / 100;
                if ($coupon['max_discount'] && $discount > $coupon['max_discount']) {
                    $discount = (float)$coupon['max_discount'];
                }
            } else {
                $discount = (float)$coupon['value'];
            }
            $discount = min($discount, $subtotal);
        }
    }
}

// Shipping
$afterDiscount = $subtotal - $discount;
$freeAbove = 1500;
$flatRate = 99;

$freeStmt = $db->prepare("SELECT setting_value FROM hjk_settings WHERE setting_key = 'free_shipping_above'");
$freeStmt->execute();
$freeRow = $freeStmt->fetch();
if ($freeRow) $freeAbove = (float)$freeRow['setting_value'];

$flatStmt = $db->prepare("SELECT setting_value FROM hjk_settings WHERE setting_key = 'shipping_flat_rate'");
$flatStmt->execute();
$flatRow = $flatStmt->fetch();
if ($flatRow) $flatRate = (float)$flatRow['setting_value'];

$shippingCost = ($afterDiscount >= $freeAbove) ? 0 : $flatRate;
$totalAmount = $subtotal - $discount + $shippingCost;

$orderNumber = 'HJK-' . date('Ymd') . '-' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
$estimatedDelivery = date('Y-m-d', strtotime('+7 days'));

// BEGIN TRANSACTION
$db->beginTransaction();

try {
    // 1. Insert order
    $oStmt = $db->prepare('INSERT INTO hjk_orders (order_number, user_id, subtotal, discount, coupon_code, shipping_cost, total_amount, payment_method, payment_status, payment_id, razorpay_order_id, order_status, estimated_delivery) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $oStmt->execute([
        $orderNumber, $userId, $subtotal, $discount, $couponCode, $shippingCost, $totalAmount,
        'razorpay',
        'paid',
        $input['razorpay_payment_id'],
        $input['razorpay_order_id'],
        'placed',
        $estimatedDelivery,
    ]);
    $orderId = (int)$db->lastInsertId();

    // 2. Insert order items
    $oiStmt = $db->prepare('INSERT INTO hjk_order_items (order_id, product_id, product_name, variant_id, color, size, quantity, unit_price, total_price, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    foreach ($cartItems as $item) {
        $oiStmt->execute([
            $orderId,
            $item['product_id'],
            $item['product_name'],
            $item['variant_id'],
            $item['color'],
            $item['size'],
            $item['quantity'],
            $item['selling_price'],
            $item['selling_price'] * $item['quantity'],
            $item['image'],
        ]);
    }

    // 3. Insert shipping address snapshot
    $saStmt = $db->prepare('INSERT INTO hjk_shipping_addresses (order_id, full_name, phone, address_line1, address_line2, city, state, pincode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $saStmt->execute([
        $orderId,
        $address['full_name'],
        $address['phone'],
        $address['address_line1'],
        $address['address_line2'],
        $address['city'],
        $address['state'],
        $address['pincode'],
    ]);

    // 4. Insert status history
    $shStmt = $db->prepare('INSERT INTO hjk_order_status_history (order_id, status, note) VALUES (?, ?, ?)');
    $shStmt->execute([$orderId, 'placed', 'Order placed via Razorpay. Payment ID: ' . $input['razorpay_payment_id']]);

    // 5. Decrement stock
    $stockStmt = $db->prepare('UPDATE hjk_variant_sizes SET stock = stock - ? WHERE variant_id = ? AND size = ? AND stock >= ?');
    foreach ($cartItems as $item) {
        $stockStmt->execute([$item['quantity'], $item['variant_id'], $item['size'], $item['quantity']]);
        if ($stockStmt->rowCount() === 0) {
            throw new Exception('Stock depleted for ' . $item['product_name']);
        }
    }

    // 6. Update product sold count
    $soldStmt = $db->prepare('UPDATE hjk_products SET total_sold = total_sold + ? WHERE id = ?');
    foreach ($cartItems as $item) {
        $soldStmt->execute([$item['quantity'], $item['product_id']]);
    }

    // 7. Increment coupon usage
    if ($couponId) {
        $db->prepare('UPDATE hjk_coupons SET used_count = used_count + 1 WHERE id = ?')->execute([$couponId]);
        $db->prepare('INSERT INTO hjk_coupon_usage (coupon_id, user_id, order_id) VALUES (?, ?, ?)')->execute([$couponId, $userId, $orderId]);
    }

    // 8. Clear cart
    $db->prepare('DELETE FROM hjk_cart_items WHERE user_id = ?')->execute([$userId]);

    $db->commit();

    // Mark the payment log as order_created (non-blocking)
    try {
        $logStmt = $db->prepare('UPDATE hjk_payment_logs SET status = ?, razorpay_payment_id = ?, razorpay_signature = ?, order_id = ?, response_payload = ?, error_message = NULL, updated_at = NOW() WHERE razorpay_order_id = ?');
        $logStmt->execute([
            'order_created',
            $input['razorpay_payment_id'],
            $input['razorpay_signature'],
            $orderId,
            json_encode($input),
            $input['razorpay_order_id'],
        ]);
    } catch (Exception $logErr) { error_log('Payment log order_created: ' . $logErr->getMessage()); }

    // Send confirmation emails (non-blocking — don't fail the order if email fails)
    try {
        OrderEmail::sendConfirmation($db, $orderId);
    } catch (Exception $emailErr) {
        error_log('Order email failed: ' . $emailErr->getMessage());
    }

    Response::success([
        'orderId' => $orderId,
        'orderNumber' => $orderNumber,
        'totalAmount' => $totalAmount,
    ], 'Order placed successfully', 201);

} catch (Exception $e) {
    $db->rollBack();

    // CRITICAL: Razorpay captured the payment but our order insert failed.
    // Log it and alert admin for manual reconciliation. (non-blocking)
    try {
        $logStmt = $db->prepare('UPDATE hjk_payment_logs SET status = ?, razorpay_payment_id = ?, razorpay_signature = ?, error_message = ?, response_payload = ?, updated_at = NOW() WHERE razorpay_order_id = ?');
        $logStmt->execute([
            'order_failed',
            $input['razorpay_payment_id'],
            $input['razorpay_signature'],
            $e->getMessage(),
            json_encode($input),
            $input['razorpay_order_id'],
        ]);
    } catch (Exception $logErr) { error_log('Payment log order_failed: ' . $logErr->getMessage()); }

    try {
        $adminEmail = Env::get('ADMIN_EMAIL');
        if ($adminEmail) {
            $appUrl = rtrim(Env::get('APP_URL', ''), '/');
            $userStmt = $db->prepare('SELECT first_name, last_name, email, phone FROM hjk_users WHERE id = ?');
            $userStmt->execute([$userId]);
            $u = $userStmt->fetch() ?: [];
            $alertHtml = '
                <h2 style="color:#c5221f;margin:0 0 10px;">Payment captured, order NOT created</h2>
                <p style="color:#333;">A Razorpay payment succeeded but the order insert failed. Manual reconciliation is required.</p>
                <table cellpadding="6" style="margin-top:12px;font-size:14px;">
                    <tr><td><strong>User</strong></td><td>' . htmlspecialchars(trim(($u['first_name'] ?? '') . ' ' . ($u['last_name'] ?? ''))) . ' (' . htmlspecialchars($u['email'] ?? '') . ', ' . htmlspecialchars($u['phone'] ?? '') . ')</td></tr>
                    <tr><td><strong>Razorpay Order ID</strong></td><td><code>' . htmlspecialchars($input['razorpay_order_id']) . '</code></td></tr>
                    <tr><td><strong>Razorpay Payment ID</strong></td><td><code>' . htmlspecialchars($input['razorpay_payment_id']) . '</code></td></tr>
                    <tr><td><strong>Amount</strong></td><td>&#8377;' . number_format($totalAmount, 2) . '</td></tr>
                    <tr><td><strong>Error</strong></td><td>' . htmlspecialchars($e->getMessage()) . '</td></tr>
                </table>
                <p style="margin-top:16px;"><a href="' . $appUrl . '/admin/orders/payment-logs.html" style="background:#1A1A2E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Open Payment Logs</a></p>';
            (new Mailer())->send($adminEmail, 'CRITICAL: Payment succeeded but order failed', $alertHtml);
        }
    } catch (Exception $mailErr) { error_log('Payment failure admin alert: ' . $mailErr->getMessage()); }

    Response::error('Payment was received but we could not place your order. Our team has been notified and will contact you shortly. Reference: ' . $input['razorpay_payment_id'], 500);
}
