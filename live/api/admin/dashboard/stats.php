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

// Total orders
$stmt = $db->query("SELECT COUNT(*) as total FROM hjk_orders");
$totalOrders = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Total revenue
$stmt = $db->query("SELECT COALESCE(SUM(total_amount), 0) as total FROM hjk_orders WHERE payment_status = 'paid'");
$totalRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Total customers
$stmt = $db->query("SELECT COUNT(*) as total FROM hjk_users WHERE role = 'customer'");
$totalCustomers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Total products
$stmt = $db->query("SELECT COUNT(*) as total FROM hjk_products");
$totalProducts = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Orders by status (convert to key-value map)
$stmt = $db->query("SELECT order_status, COUNT(*) as count FROM hjk_orders GROUP BY order_status");
$ordersByStatusRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$ordersByStatus = [];
foreach ($ordersByStatusRows as $row) {
    $ordersByStatus[$row['order_status']] = (int)$row['count'];
}

// Pending reviews
$stmt = $db->query("SELECT COUNT(*) as total FROM hjk_reviews WHERE status = 'pending'");
$pendingReviews = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Pending returns
$stmt = $db->query("SELECT COUNT(*) as total FROM hjk_returns WHERE status = 'pending'");
$pendingReturns = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Low stock products (stock <= 5)
$stmt = $db->query("SELECT p.name, pv.color as color, vs.size, vs.stock
    FROM hjk_variant_sizes vs
    INNER JOIN hjk_product_variants pv ON vs.variant_id = pv.id
    INNER JOIN hjk_products p ON pv.product_id = p.id
    WHERE vs.stock <= 5
    ORDER BY vs.stock ASC
    LIMIT 10");
$lowStockProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Monthly revenue for current year
$stmt = $db->prepare("SELECT MONTH(created_at) as month, COALESCE(SUM(total_amount), 0) as revenue
    FROM hjk_orders
    WHERE payment_status = 'paid' AND YEAR(created_at) = YEAR(CURRENT_DATE())
    GROUP BY MONTH(created_at)
    ORDER BY MONTH(created_at) ASC");
$stmt->execute();
$monthlyRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$monthlyRevenue = array_fill(0, 12, 0);
foreach ($monthlyRows as $row) {
    $monthlyRevenue[(int)$row['month'] - 1] = (float)$row['revenue'];
}

// Revenue this month
$stmt = $db->prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM hjk_orders WHERE payment_status = 'paid' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
$stmt->execute();
$revenueThisMonth = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Revenue last month
$stmt = $db->prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM hjk_orders WHERE payment_status = 'paid' AND MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)");
$stmt->execute();
$revenueLastMonth = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Recent 5 orders
$stmt = $db->query("SELECT o.id, o.order_number, o.total_amount, o.order_status, o.created_at, CONCAT(u.first_name, ' ', u.last_name) as customer_name FROM hjk_orders o LEFT JOIN hjk_users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5");
$recentOrdersRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);
$recentOrders = array_map(function($o) {
    return [
        'id' => $o['id'],
        'orderNumber' => $o['order_number'],
        'totalAmount' => (float)$o['total_amount'],
        'orderStatus' => $o['order_status'],
        'customerName' => $o['customer_name'] ?? 'Unknown',
        'createdAt' => $o['created_at'],
    ];
}, $recentOrdersRaw);

// Recent 5 activity logs
$stmt = $db->query("SELECT al.*, u.first_name, u.last_name FROM hjk_activity_log al LEFT JOIN hjk_users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 5");
$recentActivity = $stmt->fetchAll(PDO::FETCH_ASSOC);

Response::success([
    'totalOrders' => (int)$totalOrders,
    'totalRevenue' => (float)$totalRevenue,
    'totalCustomers' => (int)$totalCustomers,
    'totalProducts' => (int)$totalProducts,
    'ordersByStatus' => $ordersByStatus,
    'pendingReviews' => $pendingReviews,
    'pendingReturns' => $pendingReturns,
    'lowStockProducts' => $lowStockProducts,
    'monthlyRevenue' => $monthlyRevenue,
    'revenueThisMonth' => (float)$revenueThisMonth,
    'revenueLastMonth' => (float)$revenueLastMonth,
    'recentOrders' => $recentOrders,
    'recentActivity' => $recentActivity
], 'Dashboard stats fetched');
