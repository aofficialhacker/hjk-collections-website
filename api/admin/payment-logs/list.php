<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$perPage = isset($_GET['perPage']) ? max(1, min(100, (int)$_GET['perPage'])) : 20;
$status = isset($_GET['status']) ? trim($_GET['status']) : '';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$dateFrom = isset($_GET['date_from']) ? trim($_GET['date_from']) : '';
$dateTo = isset($_GET['date_to']) ? trim($_GET['date_to']) : '';
$offset = ($page - 1) * $perPage;

$where = [];
$params = [];

if ($status) {
    $where[] = 'pl.status = :status';
    $params[':status'] = $status;
}
if ($search) {
    $where[] = '(pl.razorpay_order_id LIKE :search1 OR pl.razorpay_payment_id LIKE :search2 OR u.email LIKE :search3 OR u.first_name LIKE :search4 OR u.last_name LIKE :search5)';
    $params[':search1'] = "%$search%";
    $params[':search2'] = "%$search%";
    $params[':search3'] = "%$search%";
    $params[':search4'] = "%$search%";
    $params[':search5'] = "%$search%";
}
if ($dateFrom) {
    $where[] = 'pl.created_at >= :date_from';
    $params[':date_from'] = $dateFrom . ' 00:00:00';
}
if ($dateTo) {
    $where[] = 'pl.created_at <= :date_to';
    $params[':date_to'] = $dateTo . ' 23:59:59';
}

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$cStmt = $db->prepare("SELECT COUNT(*) AS total FROM hjk_payment_logs pl LEFT JOIN hjk_users u ON pl.user_id = u.id $whereClause");
$cStmt->execute($params);
$total = (int)$cStmt->fetch(PDO::FETCH_ASSOC)['total'];

$sql = "SELECT pl.*, u.first_name, u.last_name, u.email, u.phone, o.order_number
        FROM hjk_payment_logs pl
        LEFT JOIN hjk_users u ON pl.user_id = u.id
        LEFT JOIN hjk_orders o ON pl.order_id = o.id
        $whereClause
        ORDER BY pl.created_at DESC
        LIMIT :limit OFFSET :offset";
$stmt = $db->prepare($sql);
foreach ($params as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Counts per status (for tab badges)
$summary = [];
$sumStmt = $db->query("SELECT status, COUNT(*) AS c FROM hjk_payment_logs GROUP BY status");
foreach ($sumStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $summary[$r['status']] = (int)$r['c'];
}

$mapped = array_map(function ($r) {
    return [
        'id' => (int)$r['id'],
        'userId' => (int)$r['user_id'],
        'customerName' => trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? '')) ?: 'Unknown',
        'email' => $r['email'] ?? '',
        'phone' => $r['phone'] ?? '',
        'razorpayOrderId' => $r['razorpay_order_id'],
        'razorpayPaymentId' => $r['razorpay_payment_id'],
        'amount' => (float)$r['amount'],
        'currency' => $r['currency'],
        'status' => $r['status'],
        'orderId' => $r['order_id'] !== null ? (int)$r['order_id'] : null,
        'orderNumber' => $r['order_number'] ?? null,
        'errorMessage' => $r['error_message'],
        'createdAt' => $r['created_at'],
        'updatedAt' => $r['updated_at'],
    ];
}, $rows);

echo json_encode([
    'success' => true,
    'data' => $mapped,
    'summary' => $summary,
    'pagination' => [
        'total' => $total,
        'page' => (int)$page,
        'perPage' => (int)$perPage,
        'totalPages' => (int)ceil($total / $perPage),
    ],
]);
exit;
