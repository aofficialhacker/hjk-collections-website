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

$status = $_GET['status'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = min(50, max(1, (int)($_GET['per_page'] ?? 10)));
$offset = ($page - 1) * $perPage;

$where = 'WHERE o.user_id = ?';
$params = [$userId];

if (!empty($status) && $status !== 'all') {
    if ($status === 'active') {
        $where .= " AND o.order_status IN ('placed','confirmed','processing','shipped','out_for_delivery')";
    } else {
        $where .= ' AND o.order_status = ?';
        $params[] = $status;
    }
}

// Count
$countStmt = $db->prepare("SELECT COUNT(*) FROM hjk_orders o $where");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

// Fetch orders
$stmt = $db->prepare("SELECT o.id, o.order_number AS orderNumber, o.subtotal, o.discount, o.coupon_code AS couponCode, o.shipping_cost AS shippingCost, o.total_amount AS totalAmount, o.payment_method AS paymentMethod, o.payment_status AS paymentStatus, o.order_status AS orderStatus, o.delivery_method_name AS deliveryMethodName, o.tracking_id AS trackingId, o.estimated_delivery AS estimatedDelivery, o.created_at AS createdAt, o.updated_at AS updatedAt FROM hjk_orders o $where ORDER BY o.created_at DESC LIMIT $perPage OFFSET $offset");
$stmt->execute($params);
$orders = $stmt->fetchAll();

// Fetch items for each order
foreach ($orders as &$order) {
    $order['id'] = (int)$order['id'];
    $order['subtotal'] = (float)$order['subtotal'];
    $order['discount'] = (float)$order['discount'];
    $order['shippingCost'] = (float)$order['shippingCost'];
    $order['totalAmount'] = (float)$order['totalAmount'];

    $iStmt = $db->prepare('SELECT product_id AS productId, product_name AS productName, variant_id AS variantId, color, size, quantity, unit_price AS unitPrice, total_price AS totalPrice, image FROM hjk_order_items WHERE order_id = ?');
    $iStmt->execute([$order['id']]);
    $order['items'] = $iStmt->fetchAll();

    foreach ($order['items'] as &$item) {
        $item['productId'] = (int)$item['productId'];
        $item['variantId'] = (int)$item['variantId'];
        $item['quantity'] = (int)$item['quantity'];
        $item['unitPrice'] = (float)$item['unitPrice'];
        $item['totalPrice'] = (float)$item['totalPrice'];
    }
}

Response::paginated($orders, $total, $page, $perPage);
