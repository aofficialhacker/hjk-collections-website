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
$offset = ($page - 1) * $perPage;

$where = [];
$params = [];

if ($status) {
    $where[] = "r.status = :status";
    $params[':status'] = $status;
}

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Count
$stmt = $db->prepare("SELECT COUNT(*) as total FROM hjk_reviews r $whereClause");
$stmt->execute($params);
$total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Fetch reviews
$sql = "SELECT r.*, p.name as product_name, u.first_name, u.last_name
        FROM hjk_reviews r
        LEFT JOIN hjk_products p ON r.product_id = p.id
        LEFT JOIN hjk_users u ON r.user_id = u.id
        $whereClause
        ORDER BY r.created_at DESC
        LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Map to camelCase for JS consumption
$reviews = array_map(function($r) {
    return [
        'id' => $r['id'],
        'productId' => $r['product_id'] ?? null,
        'productName' => $r['product_name'] ?? 'Unknown',
        'userId' => $r['user_id'] ?? null,
        'customerName' => trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? '')) ?: 'Unknown',
        'rating' => (int)($r['rating'] ?? 0),
        'comment' => $r['comment'] ?? $r['review_text'] ?? '',
        'status' => $r['status'] ?? 'pending',
        'createdAt' => $r['created_at'] ?? '',
    ];
}, $reviews);

Response::paginated($reviews, (int)$total, $page, $perPage);
