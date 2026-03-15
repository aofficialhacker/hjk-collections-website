<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$orderNumber = trim($_GET['order_number'] ?? '');
if (empty($orderNumber)) {
    Response::error('Order number is required');
}

$db = Database::getInstance();

$stmt = $db->prepare('SELECT id, order_number AS orderNumber, order_status AS orderStatus, tracking_id AS trackingId, delivery_method_name AS deliveryMethodName, estimated_delivery AS estimatedDelivery, created_at AS createdAt FROM hjk_orders WHERE order_number = ?');
$stmt->execute([$orderNumber]);
$order = $stmt->fetch();

if (!$order) {
    Response::error('Order not found', 404);
}

// Get status history
$hStmt = $db->prepare('SELECT status, note, tracking_id AS trackingId, created_at AS timestamp FROM hjk_order_status_history WHERE order_id = ? ORDER BY created_at ASC');
$hStmt->execute([$order['id']]);
$history = $hStmt->fetchAll();

$order['statusHistory'] = $history;
$order['id'] = (int)$order['id'];

Response::success($order);
