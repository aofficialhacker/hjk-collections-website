<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$db = Database::getInstance();

$stmt = $db->query('SELECT id, name, description, estimated_days AS estimatedDays, cost, free_above AS freeAbove, is_active AS isActive, sort_order AS sortOrder FROM hjk_delivery_options WHERE is_active = 1 ORDER BY sort_order ASC');
$options = $stmt->fetchAll();

foreach ($options as &$o) {
    $o['id'] = (int)$o['id'];
    $o['cost'] = (float)$o['cost'];
    $o['freeAbove'] = (float)$o['freeAbove'];
    $o['isActive'] = (bool)$o['isActive'];
    $o['sortOrder'] = (int)$o['sortOrder'];
}

Response::success($options);
