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

$validator = new Validator($input);
$validator->required('name');

if ($validator->fails()) {
    Response::error($validator->firstError(), 422, $validator->errors());
}

$id = isset($input['id']) ? (int)$input['id'] : null;
$name = trim($input['name']);
$slug = !empty($input['slug']) ? trim($input['slug']) : strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name));
$description = isset($input['description']) ? trim($input['description']) : '';
$isActive = isset($input['isActive']) ? (int)$input['isActive'] : (isset($input['is_active']) ? (int)$input['is_active'] : 1);
$sortOrder = isset($input['sortOrder']) ? (int)$input['sortOrder'] : (isset($input['sort_order']) ? (int)$input['sort_order'] : 0);
$imageUrl = isset($input['image']) ? $input['image'] : null;

// Handle file upload
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $upload = FileUpload::upload($_FILES['image'], 'categories', 'cat');
    if ($upload['success']) {
        // Delete old image if updating
        if ($id && $imageUrl) {
            FileUpload::delete($imageUrl);
        }
        $imageUrl = $upload['url'];
    }
}

if ($id) {
    // Update
    $sql = "UPDATE hjk_categories SET name = :name, slug = :slug, description = :description, is_active = :is_active, sort_order = :sort_order, updated_at = NOW()";
    $params = [
        ':name' => $name,
        ':slug' => $slug,
        ':description' => $description,
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

    AdminAuth::log($db, 'update_category', "Updated category: $name", 'category', $id);
    Response::success(null, 'Category updated successfully');
} else {
    // Create
    $stmt = $db->prepare("INSERT INTO hjk_categories (name, slug, description, image, is_active, sort_order, created_at, updated_at) VALUES (:name, :slug, :description, :image, :is_active, :sort_order, NOW(), NOW())");
    $stmt->execute([
        ':name' => $name,
        ':slug' => $slug,
        ':description' => $description,
        ':image' => $imageUrl,
        ':is_active' => $isActive,
        ':sort_order' => $sortOrder
    ]);

    $newId = $db->lastInsertId();
    AdminAuth::log($db, 'create_category', "Created category: $name", 'category', $newId);
    Response::success(['id' => $newId], 'Category created successfully', 201);
}
