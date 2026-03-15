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
    Response::error('Delivery option ID is required', 422);
}

$stmt = $db->prepare("SELECT id, name, is_active FROM hjk_delivery_options WHERE id = :id");
$stmt->execute([':id' => $id]);
$option = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$option) {
    Response::error('Delivery option not found', 404);
}

$newStatus = $option['is_active'] ? 0 : 1;
$stmt = $db->prepare("UPDATE hjk_delivery_options SET is_active = :status, updated_at = NOW() WHERE id = :id");
$stmt->execute([':status' => $newStatus, ':id' => $id]);

$statusText = $newStatus ? 'activated' : 'deactivated';
AdminAuth::log($db, 'toggle_delivery', "Delivery option {$option['name']} $statusText", 'delivery_option', $id);
Response::success(['is_active' => $newStatus], "Delivery option $statusText successfully");
