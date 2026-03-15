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
    Response::error('Return ID is required', 422);
}

$stmt = $db->prepare("SELECT * FROM hjk_returns WHERE id = :id");
$stmt->execute([':id' => $id]);
$return = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$return) {
    Response::error('Return request not found', 404);
}

$status = isset($input['status']) ? trim($input['status']) : $return['status'];
$adminNote = isset($input['adminNote']) ? trim($input['adminNote']) : (isset($input['admin_note']) ? trim($input['admin_note']) : $return['admin_note']);

$stmt = $db->prepare("UPDATE hjk_returns SET status = :status, admin_note = :admin_note, updated_at = NOW() WHERE id = :id");
$stmt->execute([
    ':status' => $status,
    ':admin_note' => $adminNote,
    ':id' => $id
]);

AdminAuth::log($db, 'update_return', "Return #{$return['order_number']} status changed to $status", 'return', $id);
Response::success(null, 'Return request updated successfully');
