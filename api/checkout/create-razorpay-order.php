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
$v->required('addressId', 'Shipping address');
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

// Amount in paise (Razorpay expects smallest currency unit)
$amountInPaise = (int)round($totalAmount * 100);

// Create Razorpay order via API
$keyId = Env::get('RKEYID');
$keySecret = Env::get('RSECRET');

if (!$keyId || !$keySecret) {
    Response::error('Payment gateway not configured', 500);
}

$orderData = [
    'amount' => $amountInPaise,
    'currency' => 'INR',
    'receipt' => 'rcpt_' . $userId . '_' . time(),
    'notes' => [
        'user_id' => (string)$userId,
        'address_id' => (string)$input['addressId'],
        'coupon_code' => $couponCode,
    ],
];

$ch = curl_init('https://api.razorpay.com/v1/orders');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_USERPWD => $keyId . ':' . $keySecret,
    CURLOPT_POSTFIELDS => json_encode($orderData),
    CURLOPT_TIMEOUT => 30,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    Response::error('Payment service unavailable. Please try again.', 500);
}

$rzpOrder = json_decode($response, true);

if ($httpCode !== 200 || empty($rzpOrder['id'])) {
    $errorMsg = $rzpOrder['error']['description'] ?? 'Failed to create payment order';
    Response::error($errorMsg, 500);
}

// Log the payment intent for reconciliation (non-blocking)
try {
    $cartSnapshot = array_map(function ($it) {
        return [
            'product_id' => (int)$it['product_id'],
            'product_name' => $it['product_name'],
            'variant_id' => (int)$it['variant_id'],
            'color' => $it['color'],
            'size' => $it['size'],
            'quantity' => (int)$it['quantity'],
            'selling_price' => (float)$it['selling_price'],
            'image' => $it['image'],
        ];
    }, $cartItems);
    $requestPayload = json_encode([
        'cart' => $cartSnapshot,
        'address_id' => (int)$input['addressId'],
        'address' => [
            'full_name' => $address['full_name'],
            'phone' => $address['phone'],
            'address_line1' => $address['address_line1'],
            'address_line2' => $address['address_line2'],
            'city' => $address['city'],
            'state' => $address['state'],
            'pincode' => $address['pincode'],
        ],
        'subtotal' => $subtotal,
        'discount' => $discount,
        'coupon_code' => $couponCode,
        'shipping_cost' => $shippingCost,
        'total_amount' => $totalAmount,
    ]);
    $logStmt = $db->prepare('INSERT INTO hjk_payment_logs (user_id, razorpay_order_id, amount, currency, status, request_payload, response_payload) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE request_payload = VALUES(request_payload), response_payload = VALUES(response_payload), updated_at = NOW()');
    $logStmt->execute([
        $userId,
        $rzpOrder['id'],
        $totalAmount,
        'INR',
        'created',
        $requestPayload,
        $response,
    ]);
} catch (Exception $logErr) {
    error_log('Payment log create failed: ' . $logErr->getMessage());
}

// Get user info for prefill
$userStmt = $db->prepare('SELECT first_name, last_name, email, phone FROM hjk_users WHERE id = ?');
$userStmt->execute([$userId]);
$user = $userStmt->fetch();

Response::success([
    'orderId' => $rzpOrder['id'],
    'amount' => $amountInPaise,
    'currency' => 'INR',
    'keyId' => $keyId,
    'prefill' => [
        'name' => trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? '')),
        'email' => $user['email'] ?? '',
        'contact' => $user['phone'] ?? $address['phone'] ?? '',
    ],
    'orderDetails' => [
        'subtotal' => $subtotal,
        'discount' => $discount,
        'shipping' => $shippingCost,
        'total' => $totalAmount,
    ],
]);
