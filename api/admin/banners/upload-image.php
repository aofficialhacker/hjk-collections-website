<?php
require_once __DIR__ . '/../../config/Env.php';
Env::load();
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/FileUpload.php';
require_once __DIR__ . '/../../middleware/AdminAuth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

AdminAuth::require();

if (empty($_FILES['image'])) {
    Response::error('No image uploaded', 422);
}

$result = FileUpload::upload($_FILES['image'], 'banners', 'ban_');

if (!$result['success']) {
    Response::error($result['message'], 422);
}

Response::success(['url' => $result['url']], 'Image uploaded');
