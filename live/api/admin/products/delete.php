<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$input = json_decode(file_get_contents('php://input'), true);
$id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

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

    // Get variant IDs
    $stmt = $db->prepare("SELECT id FROM hjk_product_variants WHERE product_id = :pid");
    $stmt->execute([':pid' => $id]);
    $variantIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if ($variantIds) {
        $ids = implode(',', array_map('intval', $variantIds));
        $db->exec("DELETE FROM hjk_variant_sizes WHERE variant_id IN ($ids)");
        $db->exec("DELETE FROM hjk_variant_images WHERE variant_id IN ($ids)");
    }

    $db->prepare("DELETE FROM hjk_product_variants WHERE product_id = :pid")->execute([':pid' => $id]);
    $db->prepare("DELETE FROM hjk_products WHERE id = :id")->execute([':id' => $id]);

    $db->commit();

    AdminAuth::log($db, 'delete_product', "Deleted product: {$product['name']}", 'product', $id);
    Response::success(null, 'Product deleted successfully');
} catch (Exception $e) {
    $db->rollBack();
    Response::error('Failed to delete product: ' . $e->getMessage(), 500);
}
