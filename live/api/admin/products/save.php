<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';
require_once __DIR__ . '/../../middleware/Validator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$input = Validator::getInput();

$validator = new Validator($input);
$validator->required('name');
// Accept both camelCase and snake_case for category_id
if (!isset($input['category_id']) && !isset($input['categoryId'])) {
    Response::error('category_id is required', 422);
}

if ($validator->fails()) {
    Response::error($validator->firstError(), 422, $validator->errors());
}

$id = isset($input['id']) ? (int)$input['id'] : null;
$name = trim($input['name']);
$slug = !empty($input['slug']) ? trim($input['slug']) : strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name));
$categoryId = (int)(isset($input['categoryId']) ? $input['categoryId'] : $input['category_id']);
$shortDescription = isset($input['shortDescription']) ? trim($input['shortDescription']) : (isset($input['short_description']) ? trim($input['short_description']) : '');
$fullDescription = isset($input['description']) ? trim($input['description']) : (isset($input['full_description']) ? trim($input['full_description']) : '');
$material = isset($input['material']) ? trim($input['material']) : '';
$dimensions = isset($input['dimensions']) ? trim($input['dimensions']) : '';
$weight = isset($input['weight']) ? trim($input['weight']) : '';
$tags = isset($input['tags']) ? (is_array($input['tags']) ? json_encode($input['tags']) : $input['tags']) : '[]';
$isFeatured = isset($input['isFeatured']) ? (int)$input['isFeatured'] : (isset($input['is_featured']) ? (int)$input['is_featured'] : 0);
$isActive = isset($input['isActive']) ? (int)$input['isActive'] : (isset($input['is_active']) ? (int)$input['is_active'] : 1);
$variants = isset($input['variants']) ? $input['variants'] : [];

try {
    $db->beginTransaction();

    if ($id) {
        // Update product
        $stmt = $db->prepare("UPDATE hjk_products SET category_id = :category_id, name = :name, slug = :slug, short_description = :short_desc, full_description = :full_desc, material = :material, dimensions = :dimensions, weight = :weight, tags = :tags, is_featured = :is_featured, is_active = :is_active, updated_at = NOW() WHERE id = :id");
        $stmt->execute([
            ':category_id' => $categoryId,
            ':name' => $name,
            ':slug' => $slug,
            ':short_desc' => $shortDescription,
            ':full_desc' => $fullDescription,
            ':material' => $material,
            ':dimensions' => $dimensions,
            ':weight' => $weight,
            ':tags' => $tags,
            ':is_featured' => $isFeatured,
            ':is_active' => $isActive,
            ':id' => $id
        ]);

        // Delete existing variants, images, sizes
        $stmt = $db->prepare("SELECT id FROM hjk_product_variants WHERE product_id = :pid");
        $stmt->execute([':pid' => $id]);
        $existingVariants = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if ($existingVariants) {
            $variantIds = implode(',', array_map('intval', $existingVariants));
            $db->exec("DELETE FROM hjk_variant_sizes WHERE variant_id IN ($variantIds)");
            $db->exec("DELETE FROM hjk_variant_images WHERE variant_id IN ($variantIds)");
            $db->exec("DELETE FROM hjk_product_variants WHERE product_id = $id");
        }

        $productId = $id;
    } else {
        // Create product
        $stmt = $db->prepare("INSERT INTO hjk_products (category_id, name, slug, short_description, full_description, material, dimensions, weight, tags, is_featured, is_active, avg_rating, review_count, total_sold, created_at, updated_at) VALUES (:category_id, :name, :slug, :short_desc, :full_desc, :material, :dimensions, :weight, :tags, :is_featured, :is_active, 0, 0, 0, NOW(), NOW())");
        $stmt->execute([
            ':category_id' => $categoryId,
            ':name' => $name,
            ':slug' => $slug,
            ':short_desc' => $shortDescription,
            ':full_desc' => $fullDescription,
            ':material' => $material,
            ':dimensions' => $dimensions,
            ':weight' => $weight,
            ':tags' => $tags,
            ':is_featured' => $isFeatured,
            ':is_active' => $isActive
        ]);

        $productId = $db->lastInsertId();
    }

    // Insert variants
    foreach ($variants as $vIndex => $variant) {
        $color = isset($variant['color']) ? trim($variant['color']) : '';
        $colorHex = isset($variant['colorCode']) ? trim($variant['colorCode']) : (isset($variant['colorHex']) ? trim($variant['colorHex']) : '');
        $sortOrder = isset($variant['sortOrder']) ? (int)$variant['sortOrder'] : (isset($variant['sort_order']) ? (int)$variant['sort_order'] : $vIndex);

        $stmt = $db->prepare("INSERT INTO hjk_product_variants (product_id, color, color_hex, sort_order, created_at) VALUES (:pid, :color, :color_hex, :sort_order, NOW())");
        $stmt->execute([
            ':pid' => $productId,
            ':color' => $color,
            ':color_hex' => $colorHex,
            ':sort_order' => $sortOrder
        ]);
        $variantId = $db->lastInsertId();

        // Insert images
        $images = isset($variant['images']) ? $variant['images'] : [];
        foreach ($images as $imgIndex => $imageUrl) {
            $stmt = $db->prepare("INSERT INTO hjk_variant_images (variant_id, image_url, sort_order) VALUES (:vid, :url, :sort)");
            $stmt->execute([
                ':vid' => $variantId,
                ':url' => $imageUrl,
                ':sort' => $imgIndex
            ]);
        }

        // Insert sizes
        $sizes = isset($variant['sizes']) ? $variant['sizes'] : [];
        foreach ($sizes as $size) {
            $stmt = $db->prepare("INSERT INTO hjk_variant_sizes (variant_id, size, normal_price, selling_price, stock, sku) VALUES (:vid, :size, :normal_price, :selling_price, :stock, :sku)");
            $stmt->execute([
                ':vid' => $variantId,
                ':size' => $size['size'],
                ':normal_price' => isset($size['normalPrice']) ? $size['normalPrice'] : (isset($size['normal_price']) ? $size['normal_price'] : 0),
                ':selling_price' => isset($size['sellingPrice']) ? $size['sellingPrice'] : (isset($size['selling_price']) ? $size['selling_price'] : 0),
                ':stock' => isset($size['stock']) ? (int)$size['stock'] : 0,
                ':sku' => isset($size['sku']) ? $size['sku'] : ''
            ]);
        }
    }

    $db->commit();

    $action = $id ? 'update_product' : 'create_product';
    $actionText = $id ? 'Updated' : 'Created';
    AdminAuth::log($db, $action, "$actionText product: $name", 'product', $productId);

    Response::success(['id' => $productId], "Product {$actionText} successfully", $id ? 200 : 201);

} catch (Exception $e) {
    $db->rollBack();
    Response::error('Failed to save product: ' . $e->getMessage(), 500);
}
