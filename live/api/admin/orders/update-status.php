<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';
require_once __DIR__ . '/../../middleware/Validator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$input = json_decode(file_get_contents('php://input'), true);

$validator = new Validator($input);
$validator->required('id');
$validator->required('status');

if ($validator->fails()) {
    Response::error($validator->firstError(), 422, $validator->errors());
}

$id = (int)$input['id'];
$status = trim($input['status']);
$note = isset($input['note']) ? trim($input['note']) : '';
$trackingId = isset($input['trackingId']) ? trim($input['trackingId']) : (isset($input['tracking_id']) ? trim($input['tracking_id']) : null);

// Get current order
$stmt = $db->prepare("SELECT * FROM hjk_orders WHERE id = :id");
$stmt->execute([':id' => $id]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    Response::error('Order not found', 404);
}

try {
    $db->beginTransaction();

    // Update order status
    $updateSql = "UPDATE hjk_orders SET order_status = :status, updated_at = NOW()";
    $updateParams = [':status' => $status, ':id' => $id];

    if ($trackingId) {
        $updateSql .= ", tracking_id = :tracking_id";
        $updateParams[':tracking_id'] = $trackingId;
    }

    $updateSql .= " WHERE id = :id";
    $stmt = $db->prepare($updateSql);
    $stmt->execute($updateParams);

    // Add status history
    $stmt = $db->prepare("INSERT INTO hjk_order_status_history (order_id, status, note, tracking_id, created_at) VALUES (:oid, :status, :note, :tracking_id, NOW())");
    $stmt->execute([
        ':oid' => $id,
        ':status' => $status,
        ':note' => $note,
        ':tracking_id' => $trackingId
    ]);

    $db->commit();

    AdminAuth::log($db, 'update_order_status', "Order #{$order['order_number']} status changed to $status", 'order', $id);
    Response::success(null, 'Order status updated successfully');
} catch (Exception $e) {
    $db->rollBack();
    Response::error('Failed to update order status: ' . $e->getMessage(), 500);
}
