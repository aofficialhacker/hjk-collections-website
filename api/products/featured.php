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
$limit = min(20, max(1, (int)($_GET['limit'] ?? 8)));

$stmt = $db->prepare('SELECT p.id, p.category_id AS categoryId, p.name, p.slug, p.short_description AS shortDescription, p.is_featured AS isFeatured, p.avg_rating AS averageRating, p.review_count AS totalReviews, p.total_sold AS totalSold, p.tags, c.name AS categoryName, c.slug AS categorySlug FROM hjk_products p LEFT JOIN hjk_categories c ON c.id = p.category_id WHERE p.is_featured = 1 AND p.is_active = 1 ORDER BY p.created_at DESC LIMIT ?');
$stmt->execute([$limit]);
$products = $stmt->fetchAll();

$productIds = array_column($products, 'id');

if (!empty($productIds)) {
    $placeholders = implode(',', array_fill(0, count($productIds), '?'));

    $vStmt = $db->prepare("SELECT pv.id, pv.product_id, pv.color, pv.color_hex AS colorHex FROM hjk_product_variants pv WHERE pv.product_id IN ($placeholders) ORDER BY pv.sort_order");
    $vStmt->execute($productIds);
    $variants = $vStmt->fetchAll();

    $variantIds = array_column($variants, 'id');
    $images = [];
    $sizes = [];

    if (!empty($variantIds)) {
        $vp = implode(',', array_fill(0, count($variantIds), '?'));
        $iStmt = $db->prepare("SELECT variant_id, image_url FROM hjk_variant_images WHERE variant_id IN ($vp) ORDER BY sort_order");
        $iStmt->execute($variantIds);
        foreach ($iStmt->fetchAll() as $img) {
            $images[$img['variant_id']][] = $img['image_url'];
        }

        $sStmt = $db->prepare("SELECT variant_id, size, normal_price AS normalPrice, selling_price AS sellingPrice, stock, sku FROM hjk_variant_sizes WHERE variant_id IN ($vp)");
        $sStmt->execute($variantIds);
        foreach ($sStmt->fetchAll() as $sz) {
            $sz['normalPrice'] = (float)$sz['normalPrice'];
            $sz['sellingPrice'] = (float)$sz['sellingPrice'];
            $sz['stock'] = (int)$sz['stock'];
            $vid = $sz['variant_id'];
            unset($sz['variant_id']);
            $sizes[$vid][] = $sz;
        }
    }

    $productVariants = [];
    foreach ($variants as $v) {
        $productVariants[$v['product_id']][] = [
            'id' => (int)$v['id'],
            'color' => $v['color'],
            'colorHex' => $v['colorHex'],
            'images' => $images[$v['id']] ?? [],
            'sizes' => $sizes[$v['id']] ?? [],
        ];
    }

    foreach ($products as &$p) {
        $p['id'] = (int)$p['id'];
        $p['categoryId'] = (int)$p['categoryId'];
        $p['isFeatured'] = (bool)$p['isFeatured'];
        $p['averageRating'] = (float)$p['averageRating'];
        $p['totalReviews'] = (int)$p['totalReviews'];
        $p['totalSold'] = (int)$p['totalSold'];
        $p['tags'] = json_decode($p['tags'] ?? '[]');
        $p['variants'] = $productVariants[$p['id']] ?? [];
    }
}

Response::success($products);
