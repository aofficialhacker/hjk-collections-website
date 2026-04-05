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

if (!$id) {
    Response::error('Order ID is required', 422);
}

// Fetch order
$stmt = $db->prepare("SELECT o.*, u.first_name, u.last_name, u.email, u.phone
        FROM hjk_orders o
        LEFT JOIN hjk_users u ON o.user_id = u.id
        WHERE o.id = :id");
$stmt->execute([':id' => $id]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    Response::error('Order not found', 404);
}

// Order items
$stmt = $db->prepare("SELECT * FROM hjk_order_items WHERE order_id = :oid");
$stmt->execute([':oid' => $id]);
$itemsRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);
$items = array_map(function($item) {
    return [
        'id' => $item['id'],
        'productId' => $item['product_id'] ?? null,
        'productName' => $item['product_name'] ?? '',
        'image' => $item['image'] ?? $item['image_url'] ?? '',
        'color' => $item['color'] ?? '',
        'size' => $item['size'] ?? '',
        'quantity' => (int)($item['quantity'] ?? 0),
        'unitPrice' => (float)($item['unit_price'] ?? 0),
        'totalPrice' => (float)($item['total_price'] ?? 0),
    ];
}, $itemsRaw);

// Shipping address
$stmt = $db->prepare("SELECT * FROM hjk_shipping_addresses WHERE order_id = :oid");
$stmt->execute([':oid' => $id]);
$addrRaw = $stmt->fetch(PDO::FETCH_ASSOC);
$shippingAddress = $addrRaw ? [
    'fullName' => $addrRaw['full_name'] ?? '',
    'addressLine1' => $addrRaw['address_line1'] ?? $addrRaw['address_line_1'] ?? '',
    'addressLine2' => $addrRaw['address_line2'] ?? $addrRaw['address_line_2'] ?? '',
    'city' => $addrRaw['city'] ?? '',
    'state' => $addrRaw['state'] ?? '',
    'pincode' => $addrRaw['pincode'] ?? '',
    'phone' => $addrRaw['phone'] ?? '',
] : null;

// Status history
$stmt = $db->prepare("SELECT * FROM hjk_order_status_history WHERE order_id = :oid ORDER BY created_at ASC");
$stmt->execute([':oid' => $id]);
$historyRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);
$statusHistory = array_map(function($h) {
    return [
        'status' => $h['status'] ?? $h['order_status'] ?? '',
        'note' => $h['note'] ?? $h['notes'] ?? '',
        'timestamp' => $h['created_at'] ?? '',
    ];
}, $historyRaw);

// Return info
$stmt = $db->prepare("SELECT r.*, GROUP_CONCAT(ri.product_id) as product_ids FROM hjk_returns r LEFT JOIN hjk_return_items ri ON r.id = ri.return_id WHERE r.order_id = :oid GROUP BY r.id");
$stmt->execute([':oid' => $id]);
$returns = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Map order to camelCase
$mappedOrder = [
    'id' => $order['id'],
    'orderNumber' => $order['order_number'] ?? '',
    'customer' => [
        'firstName' => $order['first_name'] ?? '',
        'lastName' => $order['last_name'] ?? '',
        'email' => $order['email'] ?? '',
        'phone' => $order['phone'] ?? '',
    ],
    'totalAmount' => (float)($order['total_amount'] ?? 0),
    'subtotal' => (float)($order['subtotal'] ?? 0),
    'discount' => (float)($order['discount'] ?? 0),
    'shippingCost' => (float)($order['shipping_cost'] ?? 0),
    'paymentStatus' => $order['payment_status'] ?? '',
    'paymentId' => $order['payment_id'] ?? '',
    'orderStatus' => $order['order_status'] ?? '',
    'trackingId' => $order['tracking_id'] ?? '',
    'createdAt' => $order['created_at'] ?? '',
    'items' => $items,
    'shippingAddress' => $shippingAddress,
    'statusHistory' => $statusHistory,
    'returns' => $returns,
];

Response::success($mappedOrder, 'Order detail fetched');
