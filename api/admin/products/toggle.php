<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$input = json_decode(file_get_contents('php://input'), true);
$id = isset($input['id']) ? (int)$input['id'] : 0;

if (!$id) {
    Response::error('Product ID is required', 422);
}

$stmt = $db->prepare("SELECT id, name, is_active FROM hjk_products WHERE id = :id");
$stmt->execute([':id' => $id]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$product) {
    Response::error('Product not found', 404);
}

$newStatus = $product['is_active'] ? 0 : 1;
$stmt = $db->prepare("UPDATE hjk_products SET is_active = :status, updated_at = NOW() WHERE id = :id");
$stmt->execute([':status' => $newStatus, ':id' => $id]);

$statusText = $newStatus ? 'activated' : 'deactivated';
AdminAuth::log($db, 'toggle_product', "Product {$product['name']} $statusText", 'product', $id);
Response::success(['is_active' => $newStatus], "Product $statusText successfully");
