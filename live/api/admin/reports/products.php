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

$limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 10;

$stmt = $db->prepare("SELECT
    oi.product_id,
    oi.product_name as name,
    SUM(oi.quantity) as total_sold,
    SUM(oi.total_price) as revenue
    FROM hjk_order_items oi
    INNER JOIN hjk_orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid'
    GROUP BY oi.product_id, oi.product_name
    ORDER BY total_sold DESC
    LIMIT :limit");
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->execute();
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Map to camelCase for JS consumption
$products = array_map(function($p) {
    return [
        'productId' => $p['product_id'] ?? null,
        'name' => $p['name'] ?? '',
        'totalSold' => (int)($p['total_sold'] ?? 0),
        'revenue' => (float)($p['revenue'] ?? 0),
    ];
}, $products);

Response::success($products, 'Product report fetched');
