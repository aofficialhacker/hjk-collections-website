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

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$id) {
    Response::error('Product ID is required', 422);
}

$stmt = $db->prepare('SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM hjk_products p LEFT JOIN hjk_categories c ON c.id = p.category_id WHERE p.id = ?');
$stmt->execute([$id]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$product) {
    Response::error('Product not found', 404);
}

// Get variants
$vStmt = $db->prepare('SELECT id, color, color_hex, sort_order FROM hjk_product_variants WHERE product_id = ? ORDER BY sort_order');
$vStmt->execute([$product['id']]);
$variants = $vStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($variants as &$v) {
    $vid = $v['id'];

    // Images
    $iStmt = $db->prepare('SELECT image_url FROM hjk_variant_images WHERE variant_id = ? ORDER BY sort_order');
    $iStmt->execute([$vid]);
    $v['images'] = array_column($iStmt->fetchAll(PDO::FETCH_ASSOC), 'image_url');

    // Sizes
    $sStmt = $db->prepare('SELECT size, normal_price, selling_price, stock, sku FROM hjk_variant_sizes WHERE variant_id = ?');
    $sStmt->execute([$vid]);
    $sizes = $sStmt->fetchAll(PDO::FETCH_ASSOC);
    $v['sizes'] = array_map(function($s) {
        return [
            'size' => $s['size'],
            'normalPrice' => (float)$s['normal_price'],
            'sellingPrice' => (float)$s['selling_price'],
            'stock' => (int)$s['stock'],
            'sku' => $s['sku'] ?? '',
        ];
    }, $sizes);

    $v['color'] = $v['color'];
    $v['colorCode'] = $v['color_hex'] ?? '';
    $v['id'] = (int)$vid;
    unset($v['color_hex'], $v['sort_order']);
}

$result = [
    'id' => (int)$product['id'],
    'categoryId' => (int)$product['category_id'],
    'categoryName' => $product['category_name'] ?? '',
    'name' => $product['name'],
    'slug' => $product['slug'],
    'shortDescription' => $product['short_description'] ?? '',
    'description' => $product['full_description'] ?? '',
    'material' => $product['material'] ?? '',
    'dimensions' => $product['dimensions'] ?? '',
    'weight' => $product['weight'] ?? '',
    'isFeatured' => (bool)$product['is_featured'],
    'isActive' => (bool)$product['is_active'],
    'variants' => $variants,
    'createdAt' => $product['created_at'] ?? '',
    'updatedAt' => $product['updated_at'] ?? '',
];

Response::success($result, 'Product detail fetched');
