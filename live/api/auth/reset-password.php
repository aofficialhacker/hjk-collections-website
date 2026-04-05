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
  ->required('password', 'New password')
  ->minLength('password', 6, 'New password');

if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$db = Database::getInstance();

$stmt = $db->prepare('SELECT id FROM hjk_users WHERE email = ?');
$stmt->execute([$input['email']]);
$user = $stmt->fetch();

if (!$user) {
    Response::error('Account not found', 404);
}

$hash = password_hash($input['password'], PASSWORD_BCRYPT);
$stmt = $db->prepare('UPDATE hjk_users SET password = ? WHERE id = ?');
$stmt->execute([$hash, $user['id']]);

Response::success(null, 'Password reset successful. Please login with your new password.');
