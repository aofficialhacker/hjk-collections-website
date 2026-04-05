<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$db = Database::getInstance();

$id = $_GET['id'] ?? '';
$slug = $_GET['slug'] ?? '';

if (empty($id) && empty($slug)) {
    Response::error('Product ID or slug is required');
}

if (!empty($id)) {
    $stmt = $db->prepare('SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM hjk_products p LEFT JOIN hjk_categories c ON c.id = p.category_id WHERE p.id = ? AND p.is_active = 1');
    $stmt->execute([(int)$id]);
} else {
    $stmt = $db->prepare('SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM hjk_products p LEFT JOIN hjk_categories c ON c.id = p.category_id WHERE p.slug = ? AND p.is_active = 1');
    $stmt->execute([$slug]);
}

$product = $stmt->fetch();
if (!$product) {
    Response::error('Product not found', 404);
}

// Get variants
$vStmt = $db->prepare('SELECT id, color, color_hex AS colorHex, sort_order FROM hjk_product_variants WHERE product_id = ? ORDER BY sort_order');
$vStmt->execute([$product['id']]);
$variants = $vStmt->fetchAll();

foreach ($variants as &$v) {
    $vid = $v['id'];

    // Images
    $iStmt = $db->prepare('SELECT image_url FROM hjk_variant_images WHERE variant_id = ? ORDER BY sort_order');
    $iStmt->execute([$vid]);
    $v['images'] = array_column($iStmt->fetchAll(), 'image_url');

    // Sizes
    $sStmt = $db->prepare('SELECT size, normal_price AS normalPrice, selling_price AS sellingPrice, stock, sku FROM hjk_variant_sizes WHERE variant_id = ?');
    $sStmt->execute([$vid]);
    $v['sizes'] = $sStmt->fetchAll();
    foreach ($v['sizes'] as &$s) {
        $s['normalPrice'] = (float)$s['normalPrice'];
        $s['sellingPrice'] = (float)$s['sellingPrice'];
        $s['stock'] = (int)$s['stock'];
    }

    $v['id'] = (int)$vid;
    unset($v['sort_order']);
}

$result = [
    'id' => (int)$product['id'],
    'categoryId' => (int)$product['category_id'],
    'categoryName' => $product['category_name'],
    'categorySlug' => $product['category_slug'],
    'name' => $product['name'],
    'slug' => $product['slug'],
    'shortDescription' => $product['short_description'],
    'fullDescription' => $product['full_description'],
    'material' => $product['material'],
    'dimensions' => $product['dimensions'],
    'weight' => $product['weight'],
    'tags' => json_decode($product['tags'] ?? '[]'),
    'isFeatured' => (bool)$product['is_featured'],
    'isActive' => (bool)$product['is_active'],
    'averageRating' => (float)$product['avg_rating'],
    'totalReviews' => (int)$product['review_count'],
    'totalSold' => (int)$product['total_sold'],
    'variants' => $variants,
    'createdAt' => $product['created_at'],
    'updatedAt' => $product['updated_at'],
];

Response::success($result);
