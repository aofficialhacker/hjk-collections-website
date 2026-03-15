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

$stmt = $db->query("SELECT * FROM hjk_banners ORDER BY sort_order ASC, created_at DESC");
$banners = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Map to camelCase for JS consumption
$banners = array_map(function($b) {
    return [
        'id' => $b['id'],
        'title' => $b['title'] ?? '',
        'subtitle' => $b['subtitle'] ?? '',
        'image' => $b['image'] ?? $b['image_url'] ?? '',
        'buttonText' => $b['button_text'] ?? '',
        'link' => $b['link_url'] ?? $b['link'] ?? '',
        'isActive' => (bool)($b['is_active'] ?? false),
        'sortOrder' => (int)($b['sort_order'] ?? 0),
        'createdAt' => $b['created_at'] ?? '',
    ];
}, $banners);

Response::success($banners, 'Banners fetched');
