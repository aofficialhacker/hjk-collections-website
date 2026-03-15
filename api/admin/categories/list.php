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

$search = isset($_GET['search']) ? trim($_GET['search']) : '';

$sql = "SELECT c.*, COUNT(p.id) as product_count
        FROM hjk_categories c
        LEFT JOIN hjk_products p ON c.id = p.category_id";

$params = [];

if ($search) {
    $sql .= " WHERE c.name LIKE :search OR c.description LIKE :search2";
    $params[':search'] = "%$search%";
    $params[':search2'] = "%$search%";
}

$sql .= " GROUP BY c.id ORDER BY c.sort_order ASC, c.name ASC";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Map to camelCase for JS consumption
$categories = array_map(function($c) {
    return [
        'id' => $c['id'],
        'name' => $c['name'],
        'slug' => $c['slug'] ?? '',
        'image' => $c['image'] ?? '',
        'description' => $c['description'] ?? '',
        'isActive' => (bool)($c['is_active'] ?? false),
        'sortOrder' => (int)($c['sort_order'] ?? 0),
        'productCount' => (int)($c['product_count'] ?? 0),
        'createdAt' => $c['created_at'] ?? '',
        'updatedAt' => $c['updated_at'] ?? '',
    ];
}, $categories);

Response::success($categories, 'Categories fetched');
