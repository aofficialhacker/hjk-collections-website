<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';
require_once __DIR__ . '/../../middleware/Validator.php';
require_once __DIR__ . '/../../helpers/Mailer.php';
require_once __DIR__ . '/../../helpers/OrderEmail.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();
$input = Validator::getInput();

$logId = isset($input['id']) ? (int)$input['id'] : 0;
if (!$logId) Response::error('Log ID required', 422);

$stmt = $db->prepare('SELECT * FROM hjk_payment_logs WHERE id = ?');
$stmt->execute([$logId]);
$log = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$log) Response::error('Log not found', 404);

if ($log['status'] !== 'order_failed') {
    Response::error('Only order_failed logs can be recovered (current status: ' . $log['status'] . ')', 400);
}
if (!$log['razorpay_payment_id']) {
    Response::error('No Razorpay payment ID on log — cannot recover', 400);
}

$payload = json_decode($log['request_payload'] ?? '', true);
if (!is_array($payload) || empty($payload['cart']) || empty($payload['address'])) {
    Response::error('Log is missing the original cart/address snapshot — cannot recover automatically', 400);
}

$userId = (int)$log['user_id'];
$cart = $payload['cart'];
$address = $payload['address'];
$subtotal = (float)($payload['subtotal'] ?? 0);
$discount = (float)($payload['discount'] ?? 0);
$couponCode = (string)($payload['coupon_code'] ?? '');
$shippingCost = (float)($payload['shipping_cost'] ?? 0);
$totalAmount = (float)($payload['total_amount'] ?? $log['amount']);

$orderNumber = 'HJK-' . date('Ymd') . '-' . str_pad((string)mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
$estimatedDelivery = date('Y-m-d', strtotime('+7 days'));

$db->beginTransaction();
try {
    $oStmt = $db->prepare('INSERT INTO hjk_orders (order_number, user_id, subtotal, discount, coupon_code, shipping_cost, total_amount, payment_method, payment_status, payment_id, razorpay_order_id, order_status, estimated_delivery, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $oStmt->execute([
        $orderNumber, $userId, $subtotal, $discount, $couponCode, $shippingCost, $totalAmount,
        'razorpay',
        'paid',
        $log['razorpay_payment_id'],
        $log['razorpay_order_id'],
        'placed',
        $estimatedDelivery,
        'Recovered from payment log #' . $logId . ' by admin',
    ]);
    $orderId = (int)$db->lastInsertId();

    $oiStmt = $db->prepare('INSERT INTO hjk_order_items (order_id, product_id, product_name, variant_id, color, size, quantity, unit_price, total_price, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    foreach ($cart as $item) {
        $qty = (int)$item['quantity'];
        $unit = (float)$item['selling_price'];
        $oiStmt->execute([
            $orderId,
            (int)$item['product_id'],
            $item['product_name'],
            (int)$item['variant_id'],
            $item['color'],
            $item['size'],
            $qty,
            $unit,
            $unit * $qty,
            $item['image'] ?? '',
        ]);
    }

    $saStmt = $db->prepare('INSERT INTO hjk_shipping_addresses (order_id, full_name, phone, address_line1, address_line2, city, state, pincode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $saStmt->execute([
        $orderId,
        $address['full_name'],
        $address['phone'],
        $address['address_line1'],
        $address['address_line2'] ?? '',
        $address['city'],
        $address['state'],
        $address['pincode'],
    ]);

    $shStmt = $db->prepare('INSERT INTO hjk_order_status_history (order_id, status, note) VALUES (?, ?, ?)');
    $shStmt->execute([$orderId, 'placed', 'Order recovered by admin from payment log #' . $logId . '. Razorpay payment: ' . $log['razorpay_payment_id']]);

    // Decrement stock if available; do not fail the recovery if stock has gone negative.
    $stockStmt = $db->prepare('UPDATE hjk_variant_sizes SET stock = GREATEST(stock - ?, 0) WHERE variant_id = ? AND size = ?');
    foreach ($cart as $item) {
        $stockStmt->execute([(int)$item['quantity'], (int)$item['variant_id'], $item['size']]);
    }

    $soldStmt = $db->prepare('UPDATE hjk_products SET total_sold = total_sold + ? WHERE id = ?');
    foreach ($cart as $item) {
        $soldStmt->execute([(int)$item['quantity'], (int)$item['product_id']]);
    }

    $db->commit();

    // Mark log as order_created
    try {
        $up = $db->prepare('UPDATE hjk_payment_logs SET status = ?, order_id = ?, error_message = NULL, updated_at = NOW() WHERE id = ?');
        $up->execute(['order_created', $orderId, $logId]);
    } catch (Exception $e) { error_log('Recover log update: ' . $e->getMessage()); }

    AdminAuth::log($db, 'recover_payment_log', "Recovered order $orderNumber from payment log #$logId", 'payment_log', $logId);

    // Send confirmation email to customer (non-blocking)
    try {
        OrderEmail::sendConfirmation($db, $orderId);
    } catch (Exception $e) { error_log('Recover order email: ' . $e->getMessage()); }

    Response::success(['orderId' => $orderId, 'orderNumber' => $orderNumber], 'Order recovered successfully');
} catch (Exception $e) {
    $db->rollBack();
    Response::error('Recovery failed: ' . $e->getMessage(), 500);
}
