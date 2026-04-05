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

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$perPage = isset($_GET['perPage']) ? max(1, min(100, (int)$_GET['perPage'])) : (isset($_GET['per_page']) ? max(1, min(100, (int)$_GET['per_page'])) : 20);
$status = isset($_GET['status']) ? trim($_GET['status']) : '';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$dateFrom = isset($_GET['date_from']) ? trim($_GET['date_from']) : '';
$dateTo = isset($_GET['date_to']) ? trim($_GET['date_to']) : '';
$offset = ($page - 1) * $perPage;

$where = [];
$params = [];

if ($status) {
    $where[] = "o.order_status = :status";
    $params[':status'] = $status;
}

if ($search) {
    $where[] = "(o.order_number LIKE :search OR u.first_name LIKE :search2 OR u.last_name LIKE :search3 OR u.email LIKE :search4)";
    $params[':search'] = "%$search%";
    $params[':search2'] = "%$search%";
    $params[':search3'] = "%$search%";
    $params[':search4'] = "%$search%";
}

if ($dateFrom) {
    $where[] = "o.created_at >= :date_from";
    $params[':date_from'] = $dateFrom . ' 00:00:00';
}

if ($dateTo) {
    $where[] = "o.created_at <= :date_to";
    $params[':date_to'] = $dateTo . ' 23:59:59';
}

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Count
$stmt = $db->prepare("SELECT COUNT(*) as total FROM hjk_orders o LEFT JOIN hjk_users u ON o.user_id = u.id $whereClause");
$stmt->execute($params);
$total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Fetch orders
$sql = "SELECT o.*, u.first_name, u.last_name, u.email
        FROM hjk_orders o
        LEFT JOIN hjk_users u ON o.user_id = u.id
        $whereClause
        ORDER BY o.created_at DESC
        LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch items for each order and map to camelCase
$mappedOrders = [];
foreach ($orders as &$order) {
    $stmt = $db->prepare("SELECT * FROM hjk_order_items WHERE order_id = :oid");
    $stmt->execute([':oid' => $order['id']]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $mappedItems = array_map(function($item) {
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
    }, $items);

    $mappedOrders[] = [
        'id' => $order['id'],
        'orderNumber' => $order['order_number'] ?? '',
        'customerName' => trim(($order['first_name'] ?? '') . ' ' . ($order['last_name'] ?? '')) ?: 'Unknown',
        'email' => $order['email'] ?? '',
        'totalAmount' => (float)($order['total_amount'] ?? 0),
        'subtotal' => (float)($order['subtotal'] ?? 0),
        'discount' => (float)($order['discount'] ?? 0),
        'shippingCost' => (float)($order['shipping_cost'] ?? 0),
        'paymentStatus' => $order['payment_status'] ?? '',
        'paymentId' => $order['payment_id'] ?? '',
        'orderStatus' => $order['order_status'] ?? '',
        'trackingId' => $order['tracking_id'] ?? '',
        'createdAt' => $order['created_at'] ?? '',
        'items' => $mappedItems,
    ];
}

Response::paginated($mappedOrders, (int)$total, $page, $perPage);
