<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Validator.php';
require_once __DIR__ . '/../middleware/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$userId = Auth::userId();
$input = Validator::getInput();

$v = new Validator($input);
$v->required('fullName', 'Full name')
  ->required('phone', 'Phone')->phone('phone', 'Phone')
  ->required('addressLine1', 'Address')
  ->required('city', 'City')
  ->required('state', 'State')
  ->required('pincode', 'Pincode')->pincode('pincode', 'Pincode');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$db = Database::getInstance();
$addressId = (int)($input['id'] ?? 0);
$isDefault = !empty($input['isDefault']) ? 1 : 0;

// If setting as default, unset others
if ($isDefault) {
    $db->prepare('UPDATE hjk_addresses SET is_default = 0 WHERE user_id = ?')->execute([$userId]);
}

if ($addressId > 0) {
    // Update
    $stmt = $db->prepare('UPDATE hjk_addresses SET label = ?, full_name = ?, phone = ?, address_line1 = ?, address_line2 = ?, city = ?, state = ?, pincode = ?, is_default = ? WHERE id = ? AND user_id = ?');
    $stmt->execute([
        $input['label'] ?? 'Home',
        $input['fullName'],
        $input['phone'],
        $input['addressLine1'],
        $input['addressLine2'] ?? '',
        $input['city'],
        $input['state'],
        $input['pincode'],
        $isDefault,
        $addressId,
        $userId,
    ]);
} else {
    // Check if first address, auto-set default
    $countStmt = $db->prepare('SELECT COUNT(*) FROM hjk_addresses WHERE user_id = ?');
    $countStmt->execute([$userId]);
    if ((int)$countStmt->fetchColumn() === 0) {
        $isDefault = 1;
    }

    $stmt = $db->prepare('INSERT INTO hjk_addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $userId,
        $input['label'] ?? 'Home',
        $input['fullName'],
        $input['phone'],
        $input['addressLine1'],
        $input['addressLine2'] ?? '',
        $input['city'],
        $input['state'],
        $input['pincode'],
        $isDefault,
    ]);
    $addressId = (int)$db->lastInsertId();
}

Response::success(['id' => $addressId], $addressId ? 'Address saved' : 'Address created');
