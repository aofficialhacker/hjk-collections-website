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
$v->required('orderId', 'Order')
  ->required('reason', 'Reason')
  ->required('description', 'Description');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$db = Database::getInstance();
$orderId = (int)$input['orderId'];

// Verify order belongs to user and is delivered
$stmt = $db->prepare('SELECT * FROM hjk_orders WHERE id = ? AND user_id = ?');
$stmt->execute([$orderId, $userId]);
$order = $stmt->fetch();

if (!$order) {
    Response::error('Order not found', 404);
}

if ($order['order_status'] !== 'delivered') {
    Response::error('Only delivered orders can be returned');
}

// Check if return already exists
$existingStmt = $db->prepare('SELECT id FROM hjk_returns WHERE order_id = ?');
$existingStmt->execute([$orderId]);
if ($existingStmt->fetch()) {
    Response::error('A return request already exists for this order');
}

$db->beginTransaction();

try {
    // Create return
    $rStmt = $db->prepare('INSERT INTO hjk_returns (order_id, order_number, user_id, reason, description, video_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $rStmt->execute([
        $orderId,
        $order['order_number'],
        $userId,
        $input['reason'],
        $input['description'],
        $input['videoUrl'] ?? '',
        'pending',
    ]);
    $returnId = (int)$db->lastInsertId();

    // Create return items
    $items = $input['items'] ?? [];
    if (!empty($items)) {
        $riStmt = $db->prepare('INSERT INTO hjk_return_items (return_id, product_id, variant_id, size, quantity, reason) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($items as $item) {
            $riStmt->execute([
                $returnId,
                (int)$item['productId'],
                (int)($item['variantId'] ?? 0),
                $item['size'] ?? '',
                (int)($item['quantity'] ?? 1),
                $item['reason'] ?? $input['reason'],
            ]);
        }
    }

    $db->commit();
    Response::success(['returnId' => $returnId], 'Return request submitted', 201);

} catch (Exception $e) {
    $db->rollBack();
    Response::error('Failed to submit return request', 500);
}
