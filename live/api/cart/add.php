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
  ->required('variantId', 'Variant')
  ->required('size', 'Size');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$db = Database::getInstance();
$productId = (int)$input['productId'];
$variantId = (int)$input['variantId'];
$size = $input['size'];
$quantity = max(1, (int)($input['quantity'] ?? 1));

// Verify product and stock
$stmt = $db->prepare('SELECT vs.selling_price, vs.stock FROM hjk_variant_sizes vs JOIN hjk_product_variants pv ON pv.id = vs.variant_id JOIN hjk_products p ON p.id = pv.product_id WHERE p.id = ? AND pv.id = ? AND vs.size = ? AND p.is_active = 1');
$stmt->execute([$productId, $variantId, $size]);
$sizeData = $stmt->fetch();

if (!$sizeData) {
    Response::error('Product variant not found');
}

if ($sizeData['stock'] < $quantity) {
    Response::error('Insufficient stock. Available: ' . $sizeData['stock']);
}

// Check existing cart item
$stmt = $db->prepare('SELECT id, quantity FROM hjk_cart_items WHERE user_id = ? AND product_id = ? AND variant_id = ? AND size = ?');
$stmt->execute([$userId, $productId, $variantId, $size]);
$existing = $stmt->fetch();

if ($existing) {
    $newQty = $existing['quantity'] + $quantity;
    if ($newQty > $sizeData['stock']) {
        Response::error('Cannot add more. Stock limit: ' . $sizeData['stock']);
    }
    $stmt = $db->prepare('UPDATE hjk_cart_items SET quantity = ?, price_at_add = ? WHERE id = ?');
    $stmt->execute([$newQty, $sizeData['selling_price'], $existing['id']]);
} else {
    $stmt = $db->prepare('INSERT INTO hjk_cart_items (user_id, product_id, variant_id, size, quantity, price_at_add) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$userId, $productId, $variantId, $size, $quantity, $sizeData['selling_price']]);
}

// Return cart count
$countStmt = $db->prepare('SELECT COUNT(*) FROM hjk_cart_items WHERE user_id = ?');
$countStmt->execute([$userId]);
$count = (int)$countStmt->fetchColumn();

Response::success(['cartCount' => $count], 'Added to cart');
