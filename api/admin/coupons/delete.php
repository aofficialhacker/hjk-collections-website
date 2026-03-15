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
    Response::error('Coupon ID is required', 422);
}

$stmt = $db->prepare("SELECT * FROM hjk_coupons WHERE id = :id");
$stmt->execute([':id' => $id]);
$coupon = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$coupon) {
    Response::error('Coupon not found', 404);
}

$stmt = $db->prepare("DELETE FROM hjk_coupons WHERE id = :id");
$stmt->execute([':id' => $id]);

AdminAuth::log($db, 'delete_coupon', "Deleted coupon: {$coupon['code']}", 'coupon', $id);
Response::success(null, 'Coupon deleted successfully');
