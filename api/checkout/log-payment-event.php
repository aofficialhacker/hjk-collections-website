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
$v->required('razorpay_order_id', 'Razorpay order ID')
  ->required('event', 'Event');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$event = $input['event'];
$allowed = ['cancelled', 'payment_failed'];
if (!in_array($event, $allowed, true)) {
    Response::error('Invalid event', 422);
}

$db = Database::getInstance();

// Only update rows that are still in the "created" state — never overwrite a
// terminal state like order_created, order_failed, or signature_failed.
$stmt = $db->prepare('UPDATE hjk_payment_logs SET status = ?, error_message = ?, response_payload = ?, updated_at = NOW() WHERE razorpay_order_id = ? AND user_id = ? AND status = ?');
$stmt->execute([
    $event,
    isset($input['error_message']) ? substr((string)$input['error_message'], 0, 1000) : null,
    json_encode($input),
    $input['razorpay_order_id'],
    $userId,
    'created',
]);

Response::success(null, 'Logged');
