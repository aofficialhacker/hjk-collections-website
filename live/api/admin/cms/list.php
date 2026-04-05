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

$stmt = $db->query("SELECT * FROM hjk_cms_pages ORDER BY created_at DESC");
$pages = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Map to camelCase for JS consumption
$pages = array_map(function($p) {
    return [
        'id' => $p['id'],
        'title' => $p['title'] ?? '',
        'slug' => $p['slug'] ?? '',
        'content' => $p['content'] ?? '',
        'metaDescription' => $p['meta_description'] ?? '',
        'createdAt' => $p['created_at'] ?? '',
        'updatedAt' => $p['updated_at'] ?? '',
    ];
}, $pages);

Response::success($pages, 'CMS pages fetched');
