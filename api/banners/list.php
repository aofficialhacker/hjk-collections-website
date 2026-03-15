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

$stmt = $db->query('SELECT id, title, subtitle, image, button_text AS buttonText, link_url AS linkUrl, is_active AS isActive, sort_order AS sortOrder FROM hjk_banners WHERE is_active = 1 ORDER BY sort_order ASC');
$banners = $stmt->fetchAll();

foreach ($banners as &$b) {
    $b['isActive'] = (bool)$b['isActive'];
    $b['sortOrder'] = (int)$b['sortOrder'];
    $b['id'] = (int)$b['id'];
}

Response::success($banners);
