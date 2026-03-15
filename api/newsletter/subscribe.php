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

// Check if already subscribed
$stmt = $db->prepare('SELECT id FROM hjk_newsletter WHERE email = ?');
$stmt->execute([$input['email']]);
if ($stmt->fetch()) {
    Response::success(null, 'You are already subscribed!');
}

$stmt = $db->prepare('INSERT INTO hjk_newsletter (email) VALUES (?)');
$stmt->execute([$input['email']]);

Response::success(null, 'Successfully subscribed to newsletter!');
