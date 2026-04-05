<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../middleware/AdminAuth.php';

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

$stmt = $db->prepare('SELECT id, first_name, last_name, email, password, role, is_active FROM hjk_users WHERE email = ? AND role = ?');
$stmt->execute([$input['email'], 'superadmin']);
$admin = $stmt->fetch();

if (!$admin || !password_verify($input['password'], $admin['password'])) {
    Response::error('Invalid admin credentials', 401);
}

if (!$admin['is_active']) {
    Response::error('Account deactivated', 403);
}

// Set both regular user and admin sessions
Auth::login((int)$admin['id'], $admin['role']);
$_SESSION['admin_id'] = (int)$admin['id'];
$_SESSION['admin_role'] = $admin['role'];

$result = [
    'id' => (int)$admin['id'],
    'firstName' => $admin['first_name'],
    'lastName' => $admin['last_name'],
    'email' => $admin['email'],
    'role' => $admin['role'],
];

Response::success($result, 'Admin login successful');
