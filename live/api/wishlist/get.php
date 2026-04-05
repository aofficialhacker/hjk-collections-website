<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$userId = Auth::userId();
$db = Database::getInstance();

$stmt = $db->prepare('
    SELECT w.id, w.product_id AS productId, w.variant_id AS variantId, w.created_at AS addedAt,
        p.name, p.slug, p.avg_rating AS averageRating, p.review_count AS totalReviews, p.is_active AS isActive,
        (SELECT vi.image_url FROM hjk_product_variants pv2 JOIN hjk_variant_images vi ON vi.variant_id = pv2.id WHERE pv2.product_id = p.id ORDER BY pv2.sort_order, vi.sort_order LIMIT 1) AS image,
        (SELECT MIN(vs.selling_price) FROM hjk_product_variants pv3 JOIN hjk_variant_sizes vs ON vs.variant_id = pv3.id WHERE pv3.product_id = p.id) AS sellingPrice,
        (SELECT MIN(vs2.normal_price) FROM hjk_product_variants pv4 JOIN hjk_variant_sizes vs2 ON vs2.variant_id = pv4.id WHERE pv4.product_id = p.id) AS normalPrice
    FROM hjk_wishlist w
    JOIN hjk_products p ON p.id = w.product_id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
');
$stmt->execute([$userId]);
$items = $stmt->fetchAll();

foreach ($items as &$item) {
    $item['id'] = (int)$item['id'];
    $item['productId'] = (int)$item['productId'];
    $item['variantId'] = $item['variantId'] ? (int)$item['variantId'] : null;
    $item['sellingPrice'] = (float)$item['sellingPrice'];
    $item['normalPrice'] = (float)$item['normalPrice'];
    $item['isActive'] = (bool)$item['isActive'];
    $item['averageRating'] = (float)$item['averageRating'];
    $item['totalReviews'] = (int)$item['totalReviews'];
}

Response::success($items);
