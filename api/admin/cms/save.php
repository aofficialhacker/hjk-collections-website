<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';
require_once __DIR__ . '/../../middleware/Validator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$input = Validator::getInput();

$validator = new Validator($input);
$validator->required('title');
$validator->required('content');

if ($validator->fails()) {
    Response::error($validator->firstError(), 422, $validator->errors());
}

$id = isset($input['id']) ? (int)$input['id'] : null;
$title = trim($input['title']);
$slug = !empty($input['slug']) ? trim($input['slug']) : strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $title));
$content = trim($input['content']);
$metaDescription = isset($input['metaDescription']) ? trim($input['metaDescription']) : (isset($input['meta_description']) ? trim($input['meta_description']) : '');
$isActive = isset($input['is_active']) ? (int)$input['is_active'] : 1;

if ($id) {
    $stmt = $db->prepare("UPDATE hjk_cms_pages SET slug = :slug, title = :title, content = :content, meta_description = :meta, is_active = :is_active, updated_at = NOW() WHERE id = :id");
    $stmt->execute([
        ':slug' => $slug,
        ':title' => $title,
        ':content' => $content,
        ':meta' => $metaDescription,
        ':is_active' => $isActive,
        ':id' => $id
    ]);

    AdminAuth::log($db, 'update_cms', "Updated CMS page: $title", 'cms_page', $id);
    Response::success(null, 'CMS page updated successfully');
} else {
    $stmt = $db->prepare("INSERT INTO hjk_cms_pages (slug, title, content, meta_description, is_active, created_at, updated_at) VALUES (:slug, :title, :content, :meta, :is_active, NOW(), NOW())");
    $stmt->execute([
        ':slug' => $slug,
        ':title' => $title,
        ':content' => $content,
        ':meta' => $metaDescription,
        ':is_active' => $isActive
    ]);

    $newId = $db->lastInsertId();
    AdminAuth::log($db, 'create_cms', "Created CMS page: $title", 'cms_page', $newId);
    Response::success(['id' => $newId], 'CMS page created successfully', 201);
}
