<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$productId = (int)($_GET['product_id'] ?? 0);
if ($productId <= 0) {
    Response::error('Product ID is required');
}

$db = Database::getInstance();

$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = min(50, max(1, (int)($_GET['per_page'] ?? 10)));
$offset = ($page - 1) * $perPage;

$countStmt = $db->prepare('SELECT COUNT(*) FROM hjk_reviews WHERE product_id = ? AND status = ?');
$countStmt->execute([$productId, 'approved']);
$total = (int)$countStmt->fetchColumn();

$stmt = $db->prepare('SELECT id, product_id AS productId, user_id AS userId, user_name AS userName, rating, title, comment, status, admin_reply AS adminReply, created_at AS createdAt FROM hjk_reviews WHERE product_id = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
$stmt->execute([$productId, 'approved', $perPage, $offset]);
$reviews = $stmt->fetchAll();

foreach ($reviews as &$r) {
    $r['id'] = (int)$r['id'];
    $r['productId'] = (int)$r['productId'];
    $r['userId'] = (int)$r['userId'];
    $r['rating'] = (int)$r['rating'];
}

Response::paginated($reviews, $total, $page, $perPage);
