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

$productId = (int)($input['productId'] ?? 0);
if ($productId <= 0) {
    Response::error('Product ID is required');
}

$db = Database::getInstance();
$variantId = !empty($input['variantId']) ? (int)$input['variantId'] : null;

// Check if already in wishlist
$stmt = $db->prepare('SELECT id FROM hjk_wishlist WHERE user_id = ? AND product_id = ?');
$stmt->execute([$userId, $productId]);
$existing = $stmt->fetch();

if ($existing) {
    $stmt = $db->prepare('DELETE FROM hjk_wishlist WHERE id = ?');
    $stmt->execute([$existing['id']]);
    $action = 'removed';
} else {
    $stmt = $db->prepare('INSERT INTO hjk_wishlist (user_id, product_id, variant_id) VALUES (?, ?, ?)');
    $stmt->execute([$userId, $productId, $variantId]);
    $action = 'added';
}

// Get wishlist count
$countStmt = $db->prepare('SELECT COUNT(*) FROM hjk_wishlist WHERE user_id = ?');
$countStmt->execute([$userId]);
$count = (int)$countStmt->fetchColumn();

Response::success([
    'action' => $action,
    'wishlistCount' => $count,
    'inWishlist' => $action === 'added',
], $action === 'added' ? 'Added to wishlist' : 'Removed from wishlist');
