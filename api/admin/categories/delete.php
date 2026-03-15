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
    Response::error('Category ID is required', 422);
}

// Check if category exists
$stmt = $db->prepare("SELECT * FROM hjk_categories WHERE id = :id");
$stmt->execute([':id' => $id]);
$category = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$category) {
    Response::error('Category not found', 404);
}

// Check for products in category
$stmt = $db->prepare("SELECT COUNT(*) as count FROM hjk_products WHERE category_id = :id");
$stmt->execute([':id' => $id]);
$productCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

if ($productCount > 0) {
    Response::error("Cannot delete category. $productCount product(s) are assigned to this category. Please reassign or delete them first.", 409);
}

// Delete category
$stmt = $db->prepare("DELETE FROM hjk_categories WHERE id = :id");
$stmt->execute([':id' => $id]);

AdminAuth::log($db, 'delete_category', "Deleted category: {$category['name']}", 'category', $id);
Response::success(null, 'Category deleted successfully');
