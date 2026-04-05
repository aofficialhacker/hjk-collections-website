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

$code = strtoupper(trim($input['code'] ?? ''));
$orderAmount = (float)($input['orderAmount'] ?? 0);

if (empty($code)) {
    Response::error('Coupon code is required');
}

$db = Database::getInstance();

$stmt = $db->prepare('SELECT * FROM hjk_coupons WHERE code = ?');
$stmt->execute([$code]);
$coupon = $stmt->fetch();

if (!$coupon) {
    Response::error('Invalid coupon code');
}

if (!$coupon['is_active']) {
    Response::error('This coupon is no longer active');
}

$now = date('Y-m-d H:i:s');
if ($coupon['valid_from'] && $now < $coupon['valid_from']) {
    Response::error('This coupon is not yet valid');
}
if ($coupon['valid_until'] && $now > $coupon['valid_until']) {
    Response::error('This coupon has expired');
}

if ($coupon['usage_limit'] > 0 && $coupon['used_count'] >= $coupon['usage_limit']) {
    Response::error('This coupon has reached its usage limit');
}

if ($orderAmount < $coupon['min_order_amount']) {
    Response::error('Minimum order amount is ₹' . number_format($coupon['min_order_amount']));
}

// Check per-user limit
if ($coupon['per_user_limit'] > 0) {
    $usageStmt = $db->prepare('SELECT COUNT(*) FROM hjk_coupon_usage WHERE coupon_id = ? AND user_id = ?');
    $usageStmt->execute([$coupon['id'], $userId]);
    $userUsage = (int)$usageStmt->fetchColumn();
    if ($userUsage >= $coupon['per_user_limit']) {
        Response::error('You have already used this coupon');
    }
}

// Calculate discount
if ($coupon['type'] === 'percentage') {
    $discount = ($orderAmount * $coupon['value']) / 100;
    if ($coupon['max_discount'] && $discount > $coupon['max_discount']) {
        $discount = (float)$coupon['max_discount'];
    }
} else {
    $discount = (float)$coupon['value'];
}

$discount = min($discount, $orderAmount);

Response::success([
    'code' => $coupon['code'],
    'type' => $coupon['type'],
    'value' => (float)$coupon['value'],
    'discount' => round($discount, 2),
    'message' => 'Coupon applied! You save ₹' . number_format($discount),
]);
