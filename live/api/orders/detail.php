<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$userId = Auth::userId();
$db = Database::getInstance();

$orderId = (int)($_GET['id'] ?? 0);
$orderNumber = $_GET['order_number'] ?? '';

if ($orderId <= 0 && empty($orderNumber)) {
    Response::error('Order ID or number is required');
}

if ($orderId > 0) {
    $stmt = $db->prepare('SELECT * FROM hjk_orders WHERE id = ? AND user_id = ?');
    $stmt->execute([$orderId, $userId]);
} else {
    $stmt = $db->prepare('SELECT * FROM hjk_orders WHERE order_number = ? AND user_id = ?');
    $stmt->execute([$orderNumber, $userId]);
}

$order = $stmt->fetch();
if (!$order) {
    Response::error('Order not found', 404);
}

// Items
$iStmt = $db->prepare('SELECT product_id AS productId, product_name AS productName, variant_id AS variantId, color, size, quantity, unit_price AS unitPrice, total_price AS totalPrice, image FROM hjk_order_items WHERE order_id = ?');
$iStmt->execute([$order['id']]);
$items = $iStmt->fetchAll();
foreach ($items as &$item) {
    $item['productId'] = (int)$item['productId'];
    $item['variantId'] = (int)$item['variantId'];
    $item['quantity'] = (int)$item['quantity'];
    $item['unitPrice'] = (float)$item['unitPrice'];
    $item['totalPrice'] = (float)$item['totalPrice'];
}

// Shipping address
$saStmt = $db->prepare('SELECT full_name AS fullName, phone, address_line1 AS addressLine1, address_line2 AS addressLine2, city, state, pincode FROM hjk_shipping_addresses WHERE order_id = ?');
$saStmt->execute([$order['id']]);
$shippingAddress = $saStmt->fetch();

// Status history
$shStmt = $db->prepare('SELECT status, note, tracking_id AS trackingId, created_at AS timestamp FROM hjk_order_status_history WHERE order_id = ? ORDER BY created_at ASC');
$shStmt->execute([$order['id']]);
$statusHistory = $shStmt->fetchAll();

// Check if return exists
$retStmt = $db->prepare('SELECT id, status FROM hjk_returns WHERE order_id = ?');
$retStmt->execute([$order['id']]);
$returnInfo = $retStmt->fetch();

$result = [
    'id' => (int)$order['id'],
    'orderNumber' => $order['order_number'],
    'subtotal' => (float)$order['subtotal'],
    'discount' => (float)$order['discount'],
    'couponCode' => $order['coupon_code'],
    'shippingCost' => (float)$order['shipping_cost'],
    'totalAmount' => (float)$order['total_amount'],
    'paymentMethod' => $order['payment_method'],
    'paymentStatus' => $order['payment_status'],
    'paymentId' => $order['payment_id'],
    'orderStatus' => $order['order_status'],
    'deliveryMethodName' => $order['delivery_method_name'],
    'trackingId' => $order['tracking_id'],
    'estimatedDelivery' => $order['estimated_delivery'],
    'notes' => $order['notes'],
    'items' => $items,
    'shippingAddress' => $shippingAddress,
    'statusHistory' => $statusHistory,
    'returnInfo' => $returnInfo ? ['id' => (int)$returnInfo['id'], 'status' => $returnInfo['status']] : null,
    'createdAt' => $order['created_at'],
    'updatedAt' => $order['updated_at'],
];

Response::success($result);
