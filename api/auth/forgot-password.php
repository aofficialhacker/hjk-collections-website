<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Mailer.php';
require_once __DIR__ . '/../middleware/Validator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

$input = Validator::getInput();

$v = new Validator($input);
$v->required('email', 'Email')->email('email', 'Email');
if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$db = Database::getInstance();

$db->exec("CREATE TABLE IF NOT EXISTS `hjk_password_resets` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `used` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_pwreset_email` (`email`),
    INDEX `idx_pwreset_token` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$email = $input['email'];

$stmt = $db->prepare('SELECT id, first_name, email FROM hjk_users WHERE email = ? AND is_active = 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour

    $db->prepare('UPDATE hjk_password_resets SET used = 1 WHERE email = ? AND used = 0')
       ->execute([$email]);

    $db->prepare('INSERT INTO hjk_password_resets (email, token_hash, expires_at) VALUES (?, ?, ?)')
       ->execute([$email, $tokenHash, $expiresAt]);

    $appUrl = rtrim(Env::get('APP_URL', ''), '/');
    $resetLink = $appUrl . '/forgot-password.html?token=' . $token . '&email=' . urlencode($email);
    $logoUrl = $appUrl . '/assets/logo/hjklogo.webp';

    $firstName = htmlspecialchars($user['first_name'] ?: 'Customer');
    $safeLink = htmlspecialchars($resetLink);

    $html = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
            <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <tr><td style="background:#1A1A2E;padding:20px;text-align:center;">
                        <img src="' . $logoUrl . '" alt="HJK Collections" style="height:60px;width:auto;display:inline-block;background:#fff;padding:6px 10px;border-radius:8px;">
                    </td></tr>
                    <tr><td style="padding:30px;">
                        <h2 style="color:#1A1A2E;margin:0 0 10px;">Reset Your Password</h2>
                        <p style="color:#555;line-height:1.6;">Hi ' . $firstName . ',</p>
                        <p style="color:#555;line-height:1.6;">We received a request to reset the password for your HJK Collections account. Click the button below to set a new password. This link will expire in 1 hour.</p>
                        <div style="text-align:center;margin:28px 0;">
                            <a href="' . $safeLink . '" style="display:inline-block;background:#1A1A2E;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;">Reset Password</a>
                        </div>
                        <p style="color:#888;font-size:13px;line-height:1.6;">If the button doesn\'t work, copy and paste this link into your browser:<br><a href="' . $safeLink . '" style="color:#1A1A2E;word-break:break-all;">' . $safeLink . '</a></p>
                        <p style="color:#888;font-size:13px;line-height:1.6;margin-top:20px;">If you didn\'t request a password reset, you can safely ignore this email.</p>
                    </td></tr>
                    <tr><td style="background:#f8f8f8;padding:20px;text-align:center;border-top:1px solid #eee;">
                        <p style="margin:0;color:#888;font-size:12px;">HJK Collections - Premium Bags</p>
                    </td></tr>
                </table>
            </td></tr>
        </table>
    </body></html>';

    $mailer = new Mailer();
    $mailer->send($email, 'Reset Your HJK Collections Password', $html);
}

// Always return success to prevent email enumeration
Response::success(null, 'If this email is registered, you will receive a password reset link shortly.');
