<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$input = Validator::getInput() ?: json_decode(file_get_contents('php://input'), true);
$id = isset($input['id']) ? (int)$input['id'] : 0;

if (!$id) {
    Response::error('Product ID is required', 422);
}

$stmt = $db->prepare("SELECT * FROM hjk_products WHERE id = :id");
$stmt->execute([':id' => $id]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$product) {
    Response::error('Product not found', 404);
}

try {
    $db->beginTransaction();

    $newSlug = $product['slug'] . '-copy';
    $newName = $product['name'] . ' (Copy)';

    // Ensure unique slug
    $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM hjk_products WHERE slug = :slug");
    $stmt->execute([':slug' => $newSlug]);
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
    if ($count > 0) {
        $newSlug .= '-' . time();
    }

    $stmt = $db->prepare("INSERT INTO hjk_products (category_id, name, slug, short_description, full_description, material, dimensions, weight, tags, is_featured, is_active, avg_rating, review_count, total_sold, created_at, updated_at) VALUES (:category_id, :name, :slug, :short_desc, :full_desc, :material, :dimensions, :weight, :tags, :is_featured, 0, 0, 0, 0, NOW(), NOW())");
    $stmt->execute([
        ':category_id' => $product['category_id'],
        ':name' => $newName,
        ':slug' => $newSlug,
        ':short_desc' => $product['short_description'],
        ':full_desc' => $product['full_description'],
        ':material' => $product['material'],
        ':dimensions' => $product['dimensions'],
        ':weight' => $product['weight'],
        ':tags' => $product['tags'],
        ':is_featured' => $product['is_featured']
    ]);
    $newProductId = $db->lastInsertId();

    // Copy variants
    $stmt = $db->prepare("SELECT * FROM hjk_product_variants WHERE product_id = :pid");
    $stmt->execute([':pid' => $id]);
    $variants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($variants as $variant) {
        $stmt = $db->prepare("INSERT INTO hjk_product_variants (product_id, color, color_hex, sort_order, created_at) VALUES (:pid, :color, :color_hex, :sort_order, NOW())");
        $stmt->execute([
            ':pid' => $newProductId,
            ':color' => $variant['color'],
            ':color_hex' => $variant['color_hex'],
            ':sort_order' => $variant['sort_order']
        ]);
        $newVariantId = $db->lastInsertId();

        // Copy images
        $stmt2 = $db->prepare("SELECT * FROM hjk_variant_images WHERE variant_id = :vid");
        $stmt2->execute([':vid' => $variant['id']]);
        $images = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        foreach ($images as $image) {
            $stmt3 = $db->prepare("INSERT INTO hjk_variant_images (variant_id, image_url, sort_order) VALUES (:vid, :url, :sort)");
            $stmt3->execute([
                ':vid' => $newVariantId,
                ':url' => $image['image_url'],
                ':sort' => $image['sort_order']
            ]);
        }

        // Copy sizes
        $stmt2 = $db->prepare("SELECT * FROM hjk_variant_sizes WHERE variant_id = :vid");
        $stmt2->execute([':vid' => $variant['id']]);
        $sizes = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        foreach ($sizes as $size) {
            $stmt3 = $db->prepare("INSERT INTO hjk_variant_sizes (variant_id, size, normal_price, selling_price, stock, sku) VALUES (:vid, :size, :np, :sp, :stock, :sku)");
            $stmt3->execute([
                ':vid' => $newVariantId,
                ':size' => $size['size'],
                ':np' => $size['normal_price'],
                ':sp' => $size['selling_price'],
                ':stock' => $size['stock'],
                ':sku' => $size['sku'] ? $size['sku'] . '-COPY' : ''
            ]);
        }
    }

    $db->commit();

    AdminAuth::log($db, 'duplicate_product', "Duplicated product: {$product['name']} as $newName", 'product', $newProductId);
    Response::success(['id' => $newProductId], 'Product duplicated successfully', 201);
} catch (Exception $e) {
    $db->rollBack();
    Response::error('Failed to duplicate product: ' . $e->getMessage(), 500);
}
