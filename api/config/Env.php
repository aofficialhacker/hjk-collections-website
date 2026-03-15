<?php

class Env
{
    private static $loaded = false;
    private static $vars = [];

    public static function load($path = null)
    {
        if (self::$loaded) return;

        $path = $path ?: dirname(__DIR__) . '/.env';

        if (!file_exists($path)) {
            throw new RuntimeException('.env file not found at: ' . $path);
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            $line = trim($line);

            // Skip comments
            if (strpos($line, '#') === 0) continue;

            // Parse KEY=VALUE
            if (strpos($line, '=') === false) continue;

            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Remove surrounding quotes
            if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                $value = substr($value, 1, -1);
            }

            self::$vars[$key] = $value;
            putenv("$key=$value");
        }

        self::$loaded = true;
    }

    public static function get($key, $default = null)
    {
        return self::$vars[$key] ?? getenv($key) ?: $default;
    }
}
