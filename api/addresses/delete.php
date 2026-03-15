<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$userId = Auth::userId();
$input = Validator::getInput();
$addressId = (int)($input['id'] ?? $_GET['id'] ?? 0);

if ($addressId <= 0) {
    Response::error('Address ID is required');
}

$db = Database::getInstance();

$stmt = $db->prepare('DELETE FROM hjk_addresses WHERE id = ? AND user_id = ?');
$stmt->execute([$addressId, $userId]);

if ($stmt->rowCount() === 0) {
    Response::error('Address not found', 404);
}

Response::success(null, 'Address deleted');
