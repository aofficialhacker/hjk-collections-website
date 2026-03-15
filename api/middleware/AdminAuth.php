<?php

class AdminAuth
{
    public static function check()
    {
        return isset($_SESSION['admin_id']);
    }

    public static function require()
    {
        if (!self::check()) {
            Response::error('Admin access required', 401);
        }
    }

    public static function adminId()
    {
        return $_SESSION['admin_id'] ?? null;
    }

    public static function login($adminId, $role)
    {
        $_SESSION['admin_id'] = $adminId;
        $_SESSION['admin_role'] = $role;
        session_regenerate_id(true);
    }

    public static function logout()
    {
        unset($_SESSION['admin_id'], $_SESSION['admin_role']);
    }

    public static function log($db, $action, $description, $entityType = null, $entityId = null)
    {
        $stmt = $db->prepare('INSERT INTO hjk_activity_log (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([self::adminId(), $action, $description, $entityType, $entityId]);
    }
}
