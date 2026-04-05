<?php

class Auth
{
    public static function check()
    {
        return isset($_SESSION['user_id']);
    }

    public static function require()
    {
        if (!self::check()) {
            Response::error('Please login to continue', 401);
        }
    }

    public static function userId()
    {
        return $_SESSION['user_id'] ?? null;
    }

    public static function user($db)
    {
        if (!self::check()) return null;

        $stmt = $db->prepare('SELECT id, first_name, last_name, email, phone, role, is_active FROM hjk_users WHERE id = ?');
        $stmt->execute([self::userId()]);
        return $stmt->fetch();
    }

    public static function login($userId, $role)
    {
        $_SESSION['user_id'] = $userId;
        $_SESSION['role'] = $role;
        session_regenerate_id(true);
    }

    public static function logout()
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params['path'], $params['domain'],
                $params['secure'], $params['httponly']
            );
        }
        session_destroy();
    }
}
