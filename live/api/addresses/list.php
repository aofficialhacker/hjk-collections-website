<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/Auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

Auth::require();
$db = Database::getInstance();

$stmt = $db->prepare('SELECT id, user_id AS userId, label, full_name AS fullName, phone, address_line1 AS addressLine1, address_line2 AS addressLine2, city, state, pincode, is_default AS isDefault, created_at AS createdAt FROM hjk_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC');
$stmt->execute([Auth::userId()]);
$addresses = $stmt->fetchAll();

foreach ($addresses as &$a) {
    $a['id'] = (int)$a['id'];
    $a['userId'] = (int)$a['userId'];
    $a['isDefault'] = (bool)$a['isDefault'];
}

Response::success($addresses);
