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
$v->required('productId', 'Product')
  ->required('rating', 'Rating')
  ->required('title', 'Title')
  ->required('comment', 'Comment');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$rating = (int)$input['rating'];
if ($rating < 1 || $rating > 5) {
    Response::error('Rating must be between 1 and 5');
}

$db = Database::getInstance();
$productId = (int)$input['productId'];

// Get user name
$userStmt = $db->prepare('SELECT first_name, last_name FROM hjk_users WHERE id = ?');
$userStmt->execute([$userId]);
$user = $userStmt->fetch();
$userName = $user['first_name'] . ' ' . substr($user['last_name'], 0, 1) . '.';

// Check if already reviewed
$existStmt = $db->prepare('SELECT id FROM hjk_reviews WHERE product_id = ? AND user_id = ?');
$existStmt->execute([$productId, $userId]);
if ($existStmt->fetch()) {
    Response::error('You have already reviewed this product');
}

$stmt = $db->prepare('INSERT INTO hjk_reviews (product_id, user_id, user_name, rating, title, comment, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([$productId, $userId, $userName, $rating, $input['title'], $input['comment'], 'pending']);

Response::success(null, 'Review submitted and pending approval', 201);
