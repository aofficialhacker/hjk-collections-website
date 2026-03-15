<?php

class FileUpload
{
    private static $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    private static $maxSize = 5242880; // 5MB

    public static function upload($file, $directory, $prefix = '')
    {
        if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
            return ['success' => false, 'message' => 'No file uploaded'];
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['success' => false, 'message' => 'Upload error: ' . $file['error']];
        }

        if (!in_array($file['type'], self::$allowedTypes)) {
            return ['success' => false, 'message' => 'Invalid file type. Allowed: JPG, PNG, WebP, GIF'];
        }

        if ($file['size'] > self::$maxSize) {
            return ['success' => false, 'message' => 'File too large. Max size: 5MB'];
        }

        $uploadDir = dirname(__DIR__) . '/uploads/' . $directory . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = $prefix . uniqid() . '_' . time() . '.' . $ext;
        $filepath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return ['success' => false, 'message' => 'Failed to save file'];
        }

        $url = '/api/uploads/' . $directory . '/' . $filename;

        return ['success' => true, 'url' => $url, 'filename' => $filename];
    }

    public static function delete($url)
    {
        if (empty($url) || strpos($url, '/api/uploads/') === false) return;

        $filepath = dirname(__DIR__) . str_replace('/api', '', $url);
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }
}
