<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$db = Database::getInstance();

$stmt = $db->query('SELECT setting_key, setting_value FROM hjk_settings');
$rows = $stmt->fetchAll();

$settings = [];
foreach ($rows as $row) {
    $settings[$row['setting_key']] = $row['setting_value'];
}

// Restructure to match frontend format
$result = [
    'siteName' => $settings['site_name'] ?? '',
    'tagline' => $settings['tagline'] ?? '',
    'logo' => $settings['logo'] ?? '',
    'favicon' => $settings['favicon'] ?? '',
    'socialLinks' => [
        'facebook' => $settings['social_facebook'] ?? '',
        'instagram' => $settings['social_instagram'] ?? '',
        'twitter' => $settings['social_twitter'] ?? '',
        'youtube' => $settings['social_youtube'] ?? '',
        'whatsapp' => $settings['social_whatsapp'] ?? '',
    ],
    'mapEmbedUrl' => $settings['map_embed_url'] ?? '',
    'contactEmail' => $settings['contact_email'] ?? '',
    'contactPhone' => $settings['contact_phone'] ?? '',
    'address' => $settings['address'] ?? '',
    'headerAnnouncement' => $settings['header_announcement'] ?? '',
    'footerAbout' => $settings['footer_about'] ?? '',
    'currency' => $settings['currency'] ?? 'INR',
    'currencySymbol' => $settings['currency_symbol'] ?? '₹',
    'freeShippingAbove' => (int)($settings['free_shipping_above'] ?? 1500),
    'shippingFlatRate' => (int)($settings['shipping_flat_rate'] ?? 99),
];

Response::success($result);
