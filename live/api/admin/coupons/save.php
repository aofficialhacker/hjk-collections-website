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
$validator->required('code');
$validator->required('type');
$validator->required('value');

if ($validator->fails()) {
    Response::error($validator->firstError(), 422, $validator->errors());
}

$id = isset($input['id']) ? (int)$input['id'] : null;
$code = strtoupper(trim($input['code']));
$type = trim($input['type']);
$value = (float)$input['value'];
$minOrderAmount = isset($input['minOrderAmount']) ? (float)$input['minOrderAmount'] : (isset($input['min_order_amount']) ? (float)$input['min_order_amount'] : 0);
$maxDiscount = isset($input['maxDiscount']) ? (float)$input['maxDiscount'] : (isset($input['max_discount']) ? (float)$input['max_discount'] : null);
$usageLimit = isset($input['usageLimit']) ? (int)$input['usageLimit'] : (isset($input['usage_limit']) ? (int)$input['usage_limit'] : null);
$perUserLimit = isset($input['perUserLimit']) ? (int)$input['perUserLimit'] : (isset($input['per_user_limit']) ? (int)$input['per_user_limit'] : null);
$validFrom = isset($input['valid_from']) ? $input['valid_from'] : null;
$validUntil = isset($input['expiryDate']) ? $input['expiryDate'] : (isset($input['valid_until']) ? $input['valid_until'] : null);
$isActive = isset($input['isActive']) ? (int)$input['isActive'] : (isset($input['is_active']) ? (int)$input['is_active'] : 1);

// Check for duplicate code
$dupSql = "SELECT id FROM hjk_coupons WHERE code = :code";
$dupParams = [':code' => $code];
if ($id) {
    $dupSql .= " AND id != :id";
    $dupParams[':id'] = $id;
}
$stmt = $db->prepare($dupSql);
$stmt->execute($dupParams);
if ($stmt->fetch()) {
    Response::error('A coupon with this code already exists', 409);
}

if ($id) {
    $stmt = $db->prepare("UPDATE hjk_coupons SET code = :code, type = :type, value = :value, min_order_amount = :min_order, max_discount = :max_discount, usage_limit = :usage_limit, per_user_limit = :per_user_limit, valid_from = :valid_from, valid_until = :valid_until, is_active = :is_active, updated_at = NOW() WHERE id = :id");
    $stmt->execute([
        ':code' => $code,
        ':type' => $type,
        ':value' => $value,
        ':min_order' => $minOrderAmount,
        ':max_discount' => $maxDiscount,
        ':usage_limit' => $usageLimit,
        ':per_user_limit' => $perUserLimit,
        ':valid_from' => $validFrom,
        ':valid_until' => $validUntil,
        ':is_active' => $isActive,
        ':id' => $id
    ]);

    AdminAuth::log($db, 'update_coupon', "Updated coupon: $code", 'coupon', $id);
    Response::success(null, 'Coupon updated successfully');
} else {
    $stmt = $db->prepare("INSERT INTO hjk_coupons (code, type, value, min_order_amount, max_discount, usage_limit, used_count, per_user_limit, valid_from, valid_until, is_active, created_at, updated_at) VALUES (:code, :type, :value, :min_order, :max_discount, :usage_limit, 0, :per_user_limit, :valid_from, :valid_until, :is_active, NOW(), NOW())");
    $stmt->execute([
        ':code' => $code,
        ':type' => $type,
        ':value' => $value,
        ':min_order' => $minOrderAmount,
        ':max_discount' => $maxDiscount,
        ':usage_limit' => $usageLimit,
        ':per_user_limit' => $perUserLimit,
        ':valid_from' => $validFrom,
        ':valid_until' => $validUntil,
        ':is_active' => $isActive
    ]);

    $newId = $db->lastInsertId();
    AdminAuth::log($db, 'create_coupon', "Created coupon: $code", 'coupon', $newId);
    Response::success(['id' => $newId], 'Coupon created successfully', 201);
}
