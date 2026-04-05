<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$userId = Auth::userId();
$input = Validator::getInput();

$v = new Validator($input);
$v->required('addressId', 'Shipping address')
  ->required('paymentMethod', 'Payment method');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

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

// Auto-calculate shipping: free above threshold, else flat rate
$afterDiscount = $subtotal - $discount;
$freeAbove = 1500;
$flatRate = 99;

// Try to read from settings
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

// Estimated delivery: default 5-7 days
$estimatedDelivery = date('Y-m-d', strtotime('+7 days'));

// BEGIN TRANSACTION
$db->beginTransaction();

try {
    // 1. Insert order
    $oStmt = $db->prepare('INSERT INTO hjk_orders (order_number, user_id, subtotal, discount, coupon_code, shipping_cost, total_amount, payment_method, payment_status, payment_id, order_status, estimated_delivery) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $oStmt->execute([
        $orderNumber, $userId, $subtotal, $discount, $couponCode, $shippingCost, $totalAmount,
        $input['paymentMethod'] ?? 'razorpay',
        $input['paymentStatus'] ?? 'paid',
        $input['paymentId'] ?? '',
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
    $shStmt->execute([$orderId, 'placed', 'Order placed']);

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

    Response::success([
        'orderId' => $orderId,
        'orderNumber' => $orderNumber,
        'totalAmount' => $totalAmount,
    ], 'Order placed successfully', 201);

} catch (Exception $e) {
    $db->rollBack();
    Response::error('Failed to place order: ' . $e->getMessage(), 500);
}
