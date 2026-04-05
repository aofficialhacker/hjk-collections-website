<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$userId = Auth::userId();
$input = Validator::getInput();

$v = new Validator($input);
$v->required('id', 'Cart item ID')->required('quantity', 'Quantity');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$db = Database::getInstance();
$cartItemId = (int)$input['id'];
$quantity = (int)$input['quantity'];

// Verify ownership
$stmt = $db->prepare('SELECT ci.id, ci.variant_id, ci.size FROM hjk_cart_items ci WHERE ci.id = ? AND ci.user_id = ?');
$stmt->execute([$cartItemId, $userId]);
$item = $stmt->fetch();

if (!$item) {
    Response::error('Cart item not found', 404);
}

if ($quantity <= 0) {
    $stmt = $db->prepare('DELETE FROM hjk_cart_items WHERE id = ?');
    $stmt->execute([$cartItemId]);
    Response::success(null, 'Item removed from cart');
}

// Check stock
$stmt = $db->prepare('SELECT stock FROM hjk_variant_sizes WHERE variant_id = ? AND size = ?');
$stmt->execute([$item['variant_id'], $item['size']]);
$stock = (int)$stmt->fetchColumn();

if ($quantity > $stock) {
    Response::error('Insufficient stock. Available: ' . $stock);
}

$stmt = $db->prepare('UPDATE hjk_cart_items SET quantity = ? WHERE id = ?');
$stmt->execute([$quantity, $cartItemId]);

Response::success(null, 'Cart updated');
