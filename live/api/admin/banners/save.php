<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/FileUpload.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';
require_once __DIR__ . '/../../middleware/Validator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

// Accept both JSON body and form-data
$contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
if (strpos($contentType, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
} else {
    $input = $_POST;
}

$id = isset($input['id']) ? (int)$input['id'] : null;
$title = isset($input['title']) ? trim($input['title']) : '';
$subtitle = isset($input['subtitle']) ? trim($input['subtitle']) : '';
$buttonText = isset($input['buttonText']) ? trim($input['buttonText']) : (isset($input['button_text']) ? trim($input['button_text']) : '');
$linkUrl = isset($input['link']) ? trim($input['link']) : (isset($input['link_url']) ? trim($input['link_url']) : '');
$isActive = isset($input['isActive']) ? (int)$input['isActive'] : (isset($input['is_active']) ? (int)$input['is_active'] : 1);
$sortOrder = isset($input['sortOrder']) ? (int)$input['sortOrder'] : (isset($input['sort_order']) ? (int)$input['sort_order'] : 0);
$imageUrl = isset($input['image']) ? $input['image'] : null;

// Handle file upload
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $upload = FileUpload::upload($_FILES['image'], 'banners', 'banner');
    if ($upload['success']) {
        if ($id && $imageUrl) {
            FileUpload::delete($imageUrl);
        }
        $imageUrl = $upload['url'];
    }
}

if ($id) {
    $sql = "UPDATE hjk_banners SET title = :title, subtitle = :subtitle, button_text = :button_text, link_url = :link_url, is_active = :is_active, sort_order = :sort_order, updated_at = NOW()";
    $params = [
        ':title' => $title,
        ':subtitle' => $subtitle,
        ':button_text' => $buttonText,
        ':link_url' => $linkUrl,
        ':is_active' => $isActive,
        ':sort_order' => $sortOrder,
        ':id' => $id
    ];

    if ($imageUrl !== null) {
        $sql .= ", image = :image";
        $params[':image'] = $imageUrl;
    }

    $sql .= " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    AdminAuth::log($db, 'update_banner', "Updated banner: $title", 'banner', $id);
    Response::success(null, 'Banner updated successfully');
} else {
    $stmt = $db->prepare("INSERT INTO hjk_banners (title, subtitle, image, button_text, link_url, is_active, sort_order, created_at, updated_at) VALUES (:title, :subtitle, :image, :button_text, :link_url, :is_active, :sort_order, NOW(), NOW())");
    $stmt->execute([
        ':title' => $title,
        ':subtitle' => $subtitle,
        ':image' => $imageUrl,
        ':button_text' => $buttonText,
        ':link_url' => $linkUrl,
        ':is_active' => $isActive,
        ':sort_order' => $sortOrder
    ]);

    $newId = $db->lastInsertId();
    AdminAuth::log($db, 'create_banner', "Created banner: $title", 'banner', $newId);
    Response::success(['id' => $newId], 'Banner created successfully', 201);
}
