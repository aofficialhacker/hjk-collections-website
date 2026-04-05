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

$stmt = $db->query("SELECT * FROM hjk_delivery_options ORDER BY sort_order ASC, name ASC");
$options = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Map to camelCase for JS consumption
$options = array_map(function($d) {
    return [
        'id' => $d['id'],
        'name' => $d['name'] ?? '',
        'estimatedDays' => $d['estimated_days'] ?? '',
        'cost' => (float)($d['cost'] ?? $d['price'] ?? 0),
        'freeAbove' => (float)($d['free_above'] ?? 0),
        'isActive' => (bool)($d['is_active'] ?? false),
        'sortOrder' => (int)($d['sort_order'] ?? 0),
    ];
}, $options);

Response::success($options, 'Delivery options fetched');
