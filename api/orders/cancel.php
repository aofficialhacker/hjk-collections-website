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
$orderId = (int)($input['id'] ?? 0);
$reason = $input['reason'] ?? 'Cancelled by customer';

if ($orderId <= 0) {
    Response::error('Order ID is required');
}

$db = Database::getInstance();

$stmt = $db->prepare('SELECT * FROM hjk_orders WHERE id = ? AND user_id = ?');
$stmt->execute([$orderId, $userId]);
$order = $stmt->fetch();

if (!$order) {
    Response::error('Order not found', 404);
}

$cancellable = ['placed', 'confirmed', 'processing'];
if (!in_array($order['order_status'], $cancellable)) {
    Response::error('This order cannot be cancelled (status: ' . $order['order_status'] . ')');
}

$db->beginTransaction();

try {
    // Update order status
    $db->prepare('UPDATE hjk_orders SET order_status = ?, updated_at = NOW() WHERE id = ?')
        ->execute(['cancelled', $orderId]);

    // Add status history
    $db->prepare('INSERT INTO hjk_order_status_history (order_id, status, note) VALUES (?, ?, ?)')
        ->execute([$orderId, 'cancelled', 'Cancelled by customer: ' . $reason]);

    // Restore stock
    $items = $db->prepare('SELECT product_id, variant_id, size, quantity FROM hjk_order_items WHERE order_id = ?');
    $items->execute([$orderId]);
    $stockStmt = $db->prepare('UPDATE hjk_variant_sizes SET stock = stock + ? WHERE variant_id = ? AND size = ?');
    $soldStmt = $db->prepare('UPDATE hjk_products SET total_sold = GREATEST(0, total_sold - ?) WHERE id = ?');

    foreach ($items->fetchAll() as $item) {
        $stockStmt->execute([$item['quantity'], $item['variant_id'], $item['size']]);
        $soldStmt->execute([$item['quantity'], $item['product_id']]);
    }

    $db->commit();
    Response::success(null, 'Order cancelled successfully');

} catch (Exception $e) {
    $db->rollBack();
    Response::error('Failed to cancel order', 500);
}
