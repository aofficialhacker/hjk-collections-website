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

$db = Database::getInstance();

$fields = [];
$params = [];

if (isset($input['firstName'])) {
    $fields[] = 'first_name = ?';
    $params[] = trim($input['firstName']);
}
if (isset($input['lastName'])) {
    $fields[] = 'last_name = ?';
    $params[] = trim($input['lastName']);
}
if (isset($input['phone'])) {
    $fields[] = 'phone = ?';
    $params[] = trim($input['phone']);
}

if (empty($fields)) {
    Response::error('No fields to update');
}

$params[] = $userId;
$stmt = $db->prepare("UPDATE hjk_users SET " . implode(', ', $fields) . " WHERE id = ?");
$stmt->execute($params);

// Return updated user data
$stmt = $db->prepare("SELECT id, first_name, last_name, email, phone, role FROM hjk_users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

Response::success([
    'id' => $user['id'],
    'firstName' => $user['first_name'],
    'lastName' => $user['last_name'],
    'email' => $user['email'],
    'phone' => $user['phone']
], 'Profile updated');
