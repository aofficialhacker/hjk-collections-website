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

if (!Auth::check()) {
    Response::success(['loggedIn' => false]);
}

$db = Database::getInstance();
$user = Auth::user($db);

if (!$user) {
    Auth::logout();
    Response::success(['loggedIn' => false]);
}

$stmt = $db->prepare('SELECT notification_prefs FROM hjk_users WHERE id = ?');
$stmt->execute([$user['id']]);
$prefs = $stmt->fetchColumn();

$result = [
    'loggedIn' => true,
    'user' => [
        'id' => (int)$user['id'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'isActive' => (bool)$user['is_active'],
        'notificationPrefs' => json_decode($prefs ?? '{}'),
    ]
];

// Also check admin session
if (isset($_SESSION['admin_id'])) {
    $result['adminLoggedIn'] = true;
    $result['adminId'] = (int)$_SESSION['admin_id'];
}

Response::success($result);
