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
$v->required('firstName', 'First name')
  ->required('lastName', 'Last name')
  ->required('email', 'Email')
  ->email('email', 'Email')
  ->required('phone', 'Phone')
  ->phone('phone', 'Phone')
  ->required('password', 'Password')
  ->minLength('password', 6, 'Password');

if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$db = Database::getInstance();

// Check existing email
$stmt = $db->prepare('SELECT id FROM hjk_users WHERE email = ?');
$stmt->execute([$input['email']]);
if ($stmt->fetch()) {
    Response::error('Email already registered', 409);
}

// Check existing phone
$stmt = $db->prepare('SELECT id FROM hjk_users WHERE phone = ?');
$stmt->execute([$input['phone']]);
if ($stmt->fetch()) {
    Response::error('Phone number already registered', 409);
}

$hash = password_hash($input['password'], PASSWORD_BCRYPT);

$stmt = $db->prepare('INSERT INTO hjk_users (first_name, last_name, email, phone, password, role, is_active, notification_prefs) VALUES (?, ?, ?, ?, ?, ?, 1, ?)');
$stmt->execute([
    $input['firstName'],
    $input['lastName'],
    $input['email'],
    $input['phone'],
    $hash,
    'customer',
    json_encode(['orderUpdates' => true, 'promotions' => false, 'newsletter' => true])
]);

$userId = (int)$db->lastInsertId();

// Auto-login
Auth::login($userId, 'customer');

$user = [
    'id' => $userId,
    'firstName' => $input['firstName'],
    'lastName' => $input['lastName'],
    'email' => $input['email'],
    'phone' => $input['phone'],
    'role' => 'customer',
    'isActive' => true,
];

Response::success($user, 'Registration successful', 201);
