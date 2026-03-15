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
$categoryId = isset($_GET['category']) ? (int)$_GET['category'] : (isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0);
$status = isset($_GET['status']) ? $_GET['status'] : '';
$offset = ($page - 1) * $perPage;

$where = [];
$params = [];

if ($search) {
    $where[] = "(p.name LIKE :search OR p.slug LIKE :search2)";
    $params[':search'] = "%$search%";
    $params[':search2'] = "%$search%";
}

if ($categoryId) {
    $where[] = "p.category_id = :category_id";
    $params[':category_id'] = $categoryId;
}

if ($status !== '') {
    $where[] = "p.is_active = :status";
    $params[':status'] = $status === 'active' ? 1 : 0;
}

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Count total
$countSql = "SELECT COUNT(*) as total FROM hjk_products p $whereClause";
$stmt = $db->prepare($countSql);
$stmt->execute($params);
$total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Fetch products
$sql = "SELECT p.*, c.name as category_name,
        (SELECT vi.image_url FROM hjk_variant_images vi
         INNER JOIN hjk_product_variants pv ON vi.variant_id = pv.id
         WHERE pv.product_id = p.id ORDER BY pv.sort_order ASC, vi.sort_order ASC LIMIT 1) as image,
        (SELECT MIN(vs.selling_price) FROM hjk_variant_sizes vs
         INNER JOIN hjk_product_variants pv2 ON vs.variant_id = pv2.id
         WHERE pv2.product_id = p.id) as min_price
        FROM hjk_products p
        LEFT JOIN hjk_categories c ON p.category_id = c.id
        $whereClause
        ORDER BY p.created_at DESC
        LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Map to camelCase for JS consumption
$products = array_map(function($p) {
    return [
        'id' => $p['id'],
        'name' => $p['name'],
        'slug' => $p['slug'] ?? '',
        'categoryId' => $p['category_id'] ?? null,
        'categoryName' => $p['category_name'] ?? '',
        'image' => $p['image'] ?? '',
        'minPrice' => $p['min_price'] !== null ? (float)$p['min_price'] : null,
        'isActive' => (bool)($p['is_active'] ?? false),
        'isFeatured' => (bool)($p['is_featured'] ?? false),
        'createdAt' => $p['created_at'] ?? '',
        'updatedAt' => $p['updated_at'] ?? '',
    ];
}, $products);

Response::paginated($products, (int)$total, $page, $perPage);
