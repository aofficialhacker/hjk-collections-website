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

$showAll = isset($_GET['all']) && $_GET['all'] === '1';
$where = $showAll ? '' : 'WHERE is_active = 1';

$stmt = $db->query("SELECT id, name, slug, description, image, is_active AS isActive, sort_order AS sortOrder, created_at AS createdAt FROM hjk_categories $where ORDER BY sort_order ASC");
$categories = $stmt->fetchAll();

foreach ($categories as &$c) {
    $c['id'] = (int)$c['id'];
    $c['isActive'] = (bool)$c['isActive'];
    $c['sortOrder'] = (int)$c['sortOrder'];
}

Response::success($categories);
