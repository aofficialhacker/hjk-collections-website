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
$stmt = $db->prepare("SELECT COUNT(*) as total FROM hjk_returns r $whereClause");
$stmt->execute($params);
$total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Fetch returns
$sql = "SELECT r.*, o.order_number, o.total_amount as order_total, u.first_name, u.last_name, u.email
        FROM hjk_returns r
        LEFT JOIN hjk_orders o ON r.order_id = o.id
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
$returns = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch return items and map to camelCase
$mappedReturns = [];
foreach ($returns as &$return) {
    $stmt = $db->prepare("SELECT ri.*, p.name as product_name FROM hjk_return_items ri LEFT JOIN hjk_products p ON ri.product_id = p.id WHERE ri.return_id = :rid");
    $stmt->execute([':rid' => $return['id']]);
    $return['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $mappedReturns[] = [
        'id' => $return['id'],
        'orderId' => $return['order_id'] ?? null,
        'orderNumber' => $return['order_number'] ?? '',
        'customerName' => trim(($return['first_name'] ?? '') . ' ' . ($return['last_name'] ?? '')) ?: 'Unknown',
        'email' => $return['email'] ?? '',
        'reason' => $return['reason'] ?? '',
        'videoUrl' => $return['video_url'] ?? '',
        'status' => $return['status'] ?? 'pending',
        'adminNote' => $return['admin_note'] ?? '',
        'createdAt' => $return['created_at'] ?? '',
        'items' => $return['items'],
    ];
}

Response::paginated($mappedReturns, (int)$total, $page, $perPage);
