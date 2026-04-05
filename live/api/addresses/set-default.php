<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$userId = Auth::userId();
$input = Validator::getInput();
$addressId = (int)($input['id'] ?? 0);

if ($addressId <= 0) {
    Response::error('Address ID is required');
}

$db = Database::getInstance();

// Verify ownership
$stmt = $db->prepare('SELECT id FROM hjk_addresses WHERE id = ? AND user_id = ?');
$stmt->execute([$addressId, $userId]);
if (!$stmt->fetch()) {
    Response::error('Address not found', 404);
}

// Unset all, then set this one
$db->prepare('UPDATE hjk_addresses SET is_default = 0 WHERE user_id = ?')->execute([$userId]);
$db->prepare('UPDATE hjk_addresses SET is_default = 1 WHERE id = ?')->execute([$addressId]);

Response::success(null, 'Default address updated');
