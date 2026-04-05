<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$userId = Auth::userId();
$input = Validator::getInput();
$cartItemId = (int)($input['id'] ?? $_GET['id'] ?? 0);

if ($cartItemId <= 0) {
    Response::error('Cart item ID is required');
}

$db = Database::getInstance();

$stmt = $db->prepare('DELETE FROM hjk_cart_items WHERE id = ? AND user_id = ?');
$stmt->execute([$cartItemId, $userId]);

if ($stmt->rowCount() === 0) {
    Response::error('Cart item not found', 404);
}

$countStmt = $db->prepare('SELECT COUNT(*) FROM hjk_cart_items WHERE user_id = ?');
$countStmt->execute([$userId]);
$count = (int)$countStmt->fetchColumn();

Response::success(['cartCount' => $count], 'Item removed from cart');
