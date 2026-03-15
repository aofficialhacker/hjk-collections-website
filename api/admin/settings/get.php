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

$stmt = $db->query("SELECT setting_key, setting_value FROM hjk_settings");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$flat = [];
foreach ($rows as $row) {
    $flat[$row['setting_key']] = $row['setting_value'];
}

// Reconstruct nested structure expected by the admin JS
$settings = [
    'siteName' => $flat['siteName'] ?? $flat['site_name'] ?? '',
    'tagline' => $flat['tagline'] ?? '',
    'email' => $flat['email'] ?? '',
    'phone' => $flat['phone'] ?? '',
    'whatsapp' => $flat['whatsapp'] ?? '',
    'address' => $flat['address'] ?? '',
    'mapUrl' => $flat['mapUrl'] ?? $flat['map_url'] ?? '',
    'socialLinks' => [
        'facebook' => $flat['social_facebook'] ?? $flat['socialLinks_facebook'] ?? '',
        'instagram' => $flat['social_instagram'] ?? $flat['socialLinks_instagram'] ?? '',
        'twitter' => $flat['social_twitter'] ?? $flat['socialLinks_twitter'] ?? '',
        'youtube' => $flat['social_youtube'] ?? $flat['socialLinks_youtube'] ?? '',
    ],
];

Response::success($settings, 'Settings fetched');
