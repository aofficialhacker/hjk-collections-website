<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$input = json_decode(file_get_contents('php://input'), true);

$id = isset($input['id']) ? (int)$input['id'] : 0;
if (!$id) {
    Response::error('Review ID is required', 422);
}

$stmt = $db->prepare("SELECT * FROM hjk_reviews WHERE id = :id");
$stmt->execute([':id' => $id]);
$review = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$review) {
    Response::error('Review not found', 404);
}

$status = isset($input['status']) ? trim($input['status']) : $review['status'];
$adminReply = isset($input['admin_reply']) ? trim($input['admin_reply']) : $review['admin_reply'];

$stmt = $db->prepare("UPDATE hjk_reviews SET status = :status, admin_reply = :admin_reply, updated_at = NOW() WHERE id = :id");
$stmt->execute([
    ':status' => $status,
    ':admin_reply' => $adminReply,
    ':id' => $id
]);

// Recalculate product avg_rating and review_count if status changed
if ($status !== $review['status']) {
    $stmt = $db->prepare("SELECT COUNT(*) as cnt, COALESCE(AVG(rating), 0) as avg_r FROM hjk_reviews WHERE product_id = :pid AND status = 'approved'");
    $stmt->execute([':pid' => $review['product_id']]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $db->prepare("UPDATE hjk_products SET avg_rating = :avg, review_count = :cnt, updated_at = NOW() WHERE id = :pid");
    $stmt->execute([
        ':avg' => round($stats['avg_r'], 2),
        ':cnt' => (int)$stats['cnt'],
        ':pid' => $review['product_id']
    ]);
}

AdminAuth::log($db, 'update_review', "Review #$id status changed to $status", 'review', $id);
Response::success(null, 'Review updated successfully');
