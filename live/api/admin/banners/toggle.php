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
    Response::error('Banner ID is required', 422);
}

$stmt = $db->prepare("SELECT id, title, is_active FROM hjk_banners WHERE id = :id");
$stmt->execute([':id' => $id]);
$banner = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$banner) {
    Response::error('Banner not found', 404);
}

$newStatus = $banner['is_active'] ? 0 : 1;
$stmt = $db->prepare("UPDATE hjk_banners SET is_active = :status, updated_at = NOW() WHERE id = :id");
$stmt->execute([':status' => $newStatus, ':id' => $id]);

$statusText = $newStatus ? 'activated' : 'deactivated';
AdminAuth::log($db, 'toggle_banner', "Banner {$banner['title']} $statusText", 'banner', $id);
Response::success(['is_active' => $newStatus], "Banner $statusText successfully");
