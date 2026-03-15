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
    SELECT ci.id, ci.product_id AS productId, ci.variant_id AS variantId, ci.size, ci.quantity, ci.price_at_add AS priceAtAdd,
        p.name AS productName, p.slug AS productSlug, p.is_active AS productActive,
        pv.color, pv.color_hex AS colorHex,
        vs.selling_price AS currentPrice, vs.normal_price AS normalPrice, vs.stock,
        (SELECT vi.image_url FROM hjk_variant_images vi WHERE vi.variant_id = pv.id ORDER BY vi.sort_order LIMIT 1) AS image
    FROM hjk_cart_items ci
    JOIN hjk_products p ON p.id = ci.product_id
    JOIN hjk_product_variants pv ON pv.id = ci.variant_id
    LEFT JOIN hjk_variant_sizes vs ON vs.variant_id = ci.variant_id AND vs.size = ci.size
    WHERE ci.user_id = ?
    ORDER BY ci.created_at DESC
');
$stmt->execute([$userId]);
$items = $stmt->fetchAll();

foreach ($items as &$item) {
    $item['id'] = (int)$item['id'];
    $item['productId'] = (int)$item['productId'];
    $item['variantId'] = (int)$item['variantId'];
    $item['quantity'] = (int)$item['quantity'];
    $item['priceAtAdd'] = (float)$item['priceAtAdd'];
    $item['currentPrice'] = (float)$item['currentPrice'];
    $item['normalPrice'] = (float)$item['normalPrice'];
    $item['stock'] = (int)$item['stock'];
    $item['productActive'] = (bool)$item['productActive'];
}

Response::success([
    'items' => $items,
    'itemCount' => count($items),
]);
