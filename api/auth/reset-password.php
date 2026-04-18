<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Validator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

$input = Validator::getInput();

$v = new Validator($input);
$v->required('email', 'Email')
  ->email('email', 'Email')
  ->required('token', 'Reset token')
  ->required('password', 'New password')
  ->minLength('password', 6, 'New password');

if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$db = Database::getInstance();

$tokenHash = hash('sha256', $input['token']);

$stmt = $db->prepare('SELECT id, expires_at, used FROM hjk_password_resets WHERE email = ? AND token_hash = ? ORDER BY id DESC LIMIT 1');
$stmt->execute([$input['email'], $tokenHash]);
$reset = $stmt->fetch();

if (!$reset) {
    Response::error('Invalid or expired reset link. Please request a new one.', 400);
}

if ((int)$reset['used'] === 1) {
    Response::error('This reset link has already been used. Please request a new one.', 400);
}

if (strtotime($reset['expires_at']) < time()) {
    Response::error('This reset link has expired. Please request a new one.', 400);
}

$stmt = $db->prepare('SELECT id FROM hjk_users WHERE email = ?');
$stmt->execute([$input['email']]);
$user = $stmt->fetch();

if (!$user) {
    Response::error('Account not found', 404);
}

$hash = password_hash($input['password'], PASSWORD_BCRYPT);
$db->prepare('UPDATE hjk_users SET password = ? WHERE id = ?')->execute([$hash, $user['id']]);
$db->prepare('UPDATE hjk_password_resets SET used = 1 WHERE id = ?')->execute([$reset['id']]);

Response::success(null, 'Password reset successful. Please login with your new password.');
