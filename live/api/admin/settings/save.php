<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();
$db = Database::getInstance();

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !is_array($input)) {
    Response::error('Invalid input. Expected key-value object.', 422);
}

$stmt = $db->prepare("INSERT INTO hjk_settings (setting_key, setting_value) VALUES (:key, :value) ON DUPLICATE KEY UPDATE setting_value = :value2");

// Flatten nested objects (e.g., socialLinks.facebook -> social_facebook)
$flatInput = [];
foreach ($input as $key => $value) {
    if (is_array($value) || is_object($value)) {
        foreach ((array)$value as $subKey => $subValue) {
            $flatInput[$key . '_' . $subKey] = is_string($subValue) ? $subValue : json_encode($subValue);
        }
    } else {
        $flatInput[$key] = is_string($value) ? $value : (string)$value;
    }
}

foreach ($flatInput as $key => $value) {
    $stmt->execute([
        ':key' => $key,
        ':value' => $value,
        ':value2' => $value
    ]);
}

AdminAuth::log($db, 'update_settings', 'Updated site settings (' . count($input) . ' keys)', 'settings', null);
Response::success(null, 'Settings saved successfully');
