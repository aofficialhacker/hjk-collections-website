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

$input = Validator::getInput();

$v = new Validator($input);
$v->required('email', 'Email')->required('password', 'Password');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$db = Database::getInstance();

$stmt = $db->prepare('SELECT id, first_name, last_name, email, phone, password, role, is_active, avatar, notification_prefs FROM hjk_users WHERE email = ? AND role = ?');
$stmt->execute([$input['email'], 'customer']);
$user = $stmt->fetch();

if (!$user || !password_verify($input['password'], $user['password'])) {
    Response::error('Invalid email or password', 401);
}

if (!$user['is_active']) {
    Response::error('Your account has been deactivated. Please contact support.', 403);
}

Auth::login((int)$user['id'], $user['role']);

$result = [
    'id' => (int)$user['id'],
    'firstName' => $user['first_name'],
    'lastName' => $user['last_name'],
    'email' => $user['email'],
    'phone' => $user['phone'],
    'avatar' => $user['avatar'],
    'role' => $user['role'],
    'isActive' => (bool)$user['is_active'],
    'notificationPrefs' => json_decode($user['notification_prefs'] ?? '{}'),
];

Response::success($result, 'Login successful');
