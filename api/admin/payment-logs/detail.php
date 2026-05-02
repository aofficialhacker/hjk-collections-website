<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$id) Response::error('Log ID required', 422);

$stmt = $db->prepare('SELECT pl.*, u.first_name, u.last_name, u.email, u.phone, o.order_number FROM hjk_payment_logs pl LEFT JOIN hjk_users u ON pl.user_id = u.id LEFT JOIN hjk_orders o ON pl.order_id = o.id WHERE pl.id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) Response::error('Log not found', 404);

Response::success([
    'id' => (int)$row['id'],
    'userId' => (int)$row['user_id'],
    'customerName' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')) ?: 'Unknown',
    'email' => $row['email'] ?? '',
    'phone' => $row['phone'] ?? '',
    'razorpayOrderId' => $row['razorpay_order_id'],
    'razorpayPaymentId' => $row['razorpay_payment_id'],
    'razorpaySignature' => $row['razorpay_signature'],
    'amount' => (float)$row['amount'],
    'currency' => $row['currency'],
    'status' => $row['status'],
    'orderId' => $row['order_id'] !== null ? (int)$row['order_id'] : null,
    'orderNumber' => $row['order_number'],
    'errorMessage' => $row['error_message'],
    'requestPayload' => $row['request_payload'] ? json_decode($row['request_payload'], true) : null,
    'responsePayload' => $row['response_payload'] ? json_decode($row['response_payload'], true) : null,
    'createdAt' => $row['created_at'],
    'updatedAt' => $row['updated_at'],
]);
