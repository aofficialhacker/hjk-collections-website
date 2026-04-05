<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$userId = Auth::userId();
$input = Validator::getInput();

$v = new Validator($input);
$v->required('currentPassword')->required('newPassword')->minLength('newPassword', 8);

if ($v->fails()) {
    Response::error($v->errors()[0]);
}

$db = Database::getInstance();

// Verify current password
$stmt = $db->prepare("SELECT password FROM hjk_users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user || !password_verify($input['currentPassword'], $user['password'])) {
    Response::error('Current password is incorrect');
}

// Update password
$hash = password_hash($input['newPassword'], PASSWORD_BCRYPT);
$stmt = $db->prepare("UPDATE hjk_users SET password = ? WHERE id = ?");
$stmt->execute([$hash, $userId]);

Response::success(null, 'Password updated successfully');
