<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$slug = $_GET['slug'] ?? '';
if (empty($slug)) {
    Response::error('Slug is required');
}

$db = Database::getInstance();

$stmt = $db->prepare('SELECT id, slug, title, content, meta_description AS metaDescription, is_active AS isActive, updated_at AS updatedAt FROM hjk_cms_pages WHERE slug = ? AND is_active = 1');
$stmt->execute([$slug]);
$page = $stmt->fetch();

if (!$page) {
    Response::error('Page not found', 404);
}

$page['id'] = (int)$page['id'];
$page['isActive'] = (bool)$page['isActive'];

Response::success($page);
