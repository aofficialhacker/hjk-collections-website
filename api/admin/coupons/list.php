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
$offset = ($page - 1) * $perPage;

// Count
$stmt = $db->query("SELECT COUNT(*) as total FROM hjk_coupons");
$total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Fetch coupons with usage stats
$sql = "SELECT c.*,
        (SELECT COUNT(*) FROM hjk_coupon_usage cu WHERE cu.coupon_id = c.id) as times_used,
        (SELECT COUNT(DISTINCT cu2.user_id) FROM hjk_coupon_usage cu2 WHERE cu2.coupon_id = c.id) as unique_users
        FROM hjk_coupons c
        ORDER BY c.created_at DESC
        LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($sql);
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Map to camelCase for JS consumption
$coupons = array_map(function($c) {
    return [
        'id' => $c['id'],
        'code' => $c['code'] ?? '',
        'type' => $c['type'] ?? $c['discount_type'] ?? 'percentage',
        'value' => (float)($c['value'] ?? $c['discount_value'] ?? 0),
        'minOrderAmount' => (float)($c['min_order_amount'] ?? 0),
        'maxDiscount' => (float)($c['max_discount'] ?? 0),
        'usageLimit' => (int)($c['usage_limit'] ?? 0),
        'perUserLimit' => (int)($c['per_user_limit'] ?? 1),
        'usedCount' => (int)($c['times_used'] ?? $c['used_count'] ?? 0),
        'expiryDate' => $c['expiry_date'] ?? $c['valid_until'] ?? null,
        'isActive' => (bool)($c['is_active'] ?? false),
        'createdAt' => $c['created_at'] ?? '',
    ];
}, $coupons);

Response::paginated($coupons, (int)$total, $page, $perPage);
