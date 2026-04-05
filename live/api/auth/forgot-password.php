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
$v->required('email', 'Email')->email('email', 'Email');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$db = Database::getInstance();

$stmt = $db->prepare('SELECT id, email FROM hjk_users WHERE email = ?');
$stmt->execute([$input['email']]);
$user = $stmt->fetch();

// Always return success to prevent email enumeration
Response::success(null, 'If this email is registered, you will receive a password reset link shortly.');
