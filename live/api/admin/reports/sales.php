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

$dateFrom = isset($_GET['dateFrom']) ? trim($_GET['dateFrom']) : (isset($_GET['date_from']) ? trim($_GET['date_from']) : date('Y-m-d', strtotime('-30 days')));
$dateTo = isset($_GET['dateTo']) ? trim($_GET['dateTo']) : (isset($_GET['date_to']) ? trim($_GET['date_to']) : date('Y-m-d'));

// Summary stats
$stmt = $db->prepare("SELECT
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COUNT(*) as total_orders,
    COALESCE(AVG(total_amount), 0) as avg_order_value
    FROM hjk_orders
    WHERE payment_status = 'paid'
    AND DATE(created_at) BETWEEN :date_from AND :date_to");
$stmt->execute([':date_from' => $dateFrom, ':date_to' => $dateTo]);
$summary = $stmt->fetch(PDO::FETCH_ASSOC);

// Daily breakdown
$stmt = $db->prepare("SELECT
    DATE(created_at) as date,
    COUNT(*) as orders,
    COALESCE(SUM(total_amount), 0) as revenue
    FROM hjk_orders
    WHERE payment_status = 'paid'
    AND DATE(created_at) BETWEEN :date_from AND :date_to
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC");
$stmt->execute([':date_from' => $dateFrom, ':date_to' => $dateTo]);
$daily = $stmt->fetchAll(PDO::FETCH_ASSOC);

Response::success([
    'totalRevenue' => (float)$summary['total_revenue'],
    'totalOrders' => (int)$summary['total_orders'],
    'avgOrderValue' => round((float)$summary['avg_order_value'], 2),
    'dateFrom' => $dateFrom,
    'dateTo' => $dateTo,
    'daily' => $daily
], 'Sales report fetched');
