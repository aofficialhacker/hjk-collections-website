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

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$id) {
    Response::error('Customer ID is required', 422);
}

// Fetch customer
$stmt = $db->prepare("SELECT id, first_name, last_name, email, phone, avatar, is_active, created_at FROM hjk_users WHERE id = ? AND role = 'customer'");
$stmt->execute([$id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    Response::error('Customer not found', 404);
}

// Fetch addresses
$addrStmt = $db->prepare("SELECT * FROM hjk_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC");
$addrStmt->execute([$id]);
$addresses = $addrStmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch recent orders
$orderStmt = $db->prepare("SELECT id, order_number, total_amount, order_status, created_at FROM hjk_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
$orderStmt->execute([$id]);
$orders = $orderStmt->fetchAll(PDO::FETCH_ASSOC);

// Order stats
$statsStmt = $db->prepare("SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as total_spent FROM hjk_orders WHERE user_id = ?");
$statsStmt->execute([$id]);
$stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

$result = [
    'id' => $user['id'],
    'firstName' => $user['first_name'],
    'lastName' => $user['last_name'],
    'email' => $user['email'],
    'phone' => $user['phone'] ?? '',
    'avatar' => $user['avatar'] ?? '',
    'isActive' => (bool)$user['is_active'],
    'createdAt' => $user['created_at'],
    'orderCount' => (int)$stats['order_count'],
    'totalSpent' => (float)$stats['total_spent'],
    'addresses' => array_map(function($a) {
        return [
            'fullName' => $a['full_name'],
            'phone' => $a['phone'],
            'addressLine1' => $a['address_line1'],
            'addressLine2' => $a['address_line2'] ?? '',
            'city' => $a['city'],
            'state' => $a['state'],
            'pincode' => $a['pincode'],
            'label' => $a['label'] ?? '',
            'isDefault' => (bool)$a['is_default'],
        ];
    }, $addresses),
    'recentOrders' => array_map(function($o) {
        return [
            'id' => $o['id'],
            'orderNumber' => $o['order_number'],
            'totalAmount' => (float)$o['total_amount'],
            'orderStatus' => $o['order_status'],
            'createdAt' => $o['created_at'],
        ];
    }, $orders),
];

Response::success($result);
