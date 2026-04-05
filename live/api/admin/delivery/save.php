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
$validator->required('name');

if ($validator->fails()) {
    Response::error($validator->firstError(), 422, $validator->errors());
}

$id = isset($input['id']) ? (int)$input['id'] : null;
$name = trim($input['name']);
$description = isset($input['description']) ? trim($input['description']) : '';
$estimatedDays = isset($input['estimatedDays']) ? trim($input['estimatedDays']) : (isset($input['estimated_days']) ? trim($input['estimated_days']) : '');
$cost = isset($input['cost']) ? (float)$input['cost'] : 0;
$freeAbove = isset($input['freeAbove']) ? (float)$input['freeAbove'] : (isset($input['free_above']) ? (float)$input['free_above'] : null);
$isActive = isset($input['isActive']) ? (int)$input['isActive'] : (isset($input['is_active']) ? (int)$input['is_active'] : 1);
$sortOrder = isset($input['sortOrder']) ? (int)$input['sortOrder'] : (isset($input['sort_order']) ? (int)$input['sort_order'] : 0);

if ($id) {
    $stmt = $db->prepare("UPDATE hjk_delivery_options SET name = :name, description = :description, estimated_days = :estimated_days, cost = :cost, free_above = :free_above, is_active = :is_active, sort_order = :sort_order, updated_at = NOW() WHERE id = :id");
    $stmt->execute([
        ':name' => $name,
        ':description' => $description,
        ':estimated_days' => $estimatedDays,
        ':cost' => $cost,
        ':free_above' => $freeAbove,
        ':is_active' => $isActive,
        ':sort_order' => $sortOrder,
        ':id' => $id
    ]);

    AdminAuth::log($db, 'update_delivery', "Updated delivery option: $name", 'delivery_option', $id);
    Response::success(null, 'Delivery option updated successfully');
} else {
    $stmt = $db->prepare("INSERT INTO hjk_delivery_options (name, description, estimated_days, cost, free_above, is_active, sort_order, created_at, updated_at) VALUES (:name, :description, :estimated_days, :cost, :free_above, :is_active, :sort_order, NOW(), NOW())");
    $stmt->execute([
        ':name' => $name,
        ':description' => $description,
        ':estimated_days' => $estimatedDays,
        ':cost' => $cost,
        ':free_above' => $freeAbove,
        ':is_active' => $isActive,
        ':sort_order' => $sortOrder
    ]);

    $newId = $db->lastInsertId();
    AdminAuth::log($db, 'create_delivery', "Created delivery option: $name", 'delivery_option', $newId);
    Response::success(['id' => $newId], 'Delivery option created successfully', 201);
}
