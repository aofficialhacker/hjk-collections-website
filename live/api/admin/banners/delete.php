<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/FileUpload.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$input = json_decode(file_get_contents('php://input'), true);
$id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

if (!$id) {
    Response::error('Banner ID is required', 422);
}

$stmt = $db->prepare("SELECT * FROM hjk_banners WHERE id = :id");
$stmt->execute([':id' => $id]);
$banner = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$banner) {
    Response::error('Banner not found', 404);
}

// Delete image file
if ($banner['image']) {
    FileUpload::delete($banner['image']);
}

$stmt = $db->prepare("DELETE FROM hjk_banners WHERE id = :id");
$stmt->execute([':id' => $id]);

AdminAuth::log($db, 'delete_banner', "Deleted banner: {$banner['title']}", 'banner', $id);
Response::success(null, 'Banner deleted successfully');
