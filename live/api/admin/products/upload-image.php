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

if (empty($_FILES['images'])) {
    Response::error('No images uploaded', 422);
}

$uploaded = [];
$files = $_FILES['images'];

// Handle both single and multiple file uploads
if (is_array($files['name'])) {
    $count = count($files['name']);
    for ($i = 0; $i < $count; $i++) {
        $file = [
            'name' => $files['name'][$i],
            'type' => $files['type'][$i],
            'tmp_name' => $files['tmp_name'][$i],
            'error' => $files['error'][$i],
            'size' => $files['size'][$i],
        ];
        $result = FileUpload::upload($file, 'products', 'prod_');
        if ($result['success']) {
            $uploaded[] = $result['url'];
        } else {
            Response::error($result['message'], 422);
        }
    }
} else {
    $result = FileUpload::upload($files, 'products', 'prod_');
    if ($result['success']) {
        $uploaded[] = $result['url'];
    } else {
        Response::error($result['message'], 422);
    }
}

Response::success(['urls' => $uploaded], count($uploaded) . ' image(s) uploaded');
