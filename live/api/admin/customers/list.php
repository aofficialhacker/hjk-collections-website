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
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$offset = ($page - 1) * $perPage;

$where = ["u.role = 'customer'"];
$params = [];

if ($search) {
    $where[] = "(u.first_name LIKE :search OR u.last_name LIKE :search2 OR u.email LIKE :search3 OR u.phone LIKE :search4)";
    $params[':search'] = "%$search%";
    $params[':search2'] = "%$search%";
    $params[':search3'] = "%$search%";
    $params[':search4'] = "%$search%";
}

$whereClause = 'WHERE ' . implode(' AND ', $where);

// Count
$stmt = $db->prepare("SELECT COUNT(*) as total FROM hjk_users u $whereClause");
$stmt->execute($params);
$total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Fetch customers
$sql = "SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active, u.created_at,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
        FROM hjk_users u
        LEFT JOIN hjk_orders o ON u.id = o.user_id
        $whereClause
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Map to camelCase for JS consumption
$customers = array_map(function($u) {
    return [
        'id' => $u['id'],
        'firstName' => $u['first_name'] ?? '',
        'lastName' => $u['last_name'] ?? '',
        'email' => $u['email'] ?? '',
        'phone' => $u['phone'] ?? '',
        'avatar' => $u['avatar'] ?? '',
        'isActive' => (bool)($u['is_active'] ?? true),
        'orderCount' => (int)($u['order_count'] ?? 0),
        'totalSpent' => (float)($u['total_spent'] ?? 0),
        'createdAt' => $u['created_at'] ?? '',
    ];
}, $customers);

Response::paginated($customers, (int)$total, $page, $perPage);
