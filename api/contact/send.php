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
$v->required('name', 'Name')
  ->maxLength('name', 100, 'Name')
  ->required('email', 'Email')
  ->email('email', 'Email')
  ->maxLength('email', 255, 'Email')
  ->required('subject', 'Subject')
  ->maxLength('subject', 100, 'Subject')
  ->required('message', 'Message')
  ->minLength('message', 5, 'Message')
  ->maxLength('message', 5000, 'Message');

if (!empty($input['phone'])) {
    if (!preg_match('/^[0-9+\-\s()]{6,20}$/', $input['phone'])) {
        Response::error('Invalid phone number', 422);
    }
}

if ($v->fails()) {
    Response::error($v->firstError(), 422, $v->errors());
}

$name = trim($input['name']);
$email = trim($input['email']);
$phone = trim($input['phone'] ?? '');
$subject = trim($input['subject']);
$message = trim($input['message']);

$db = Database::getInstance();

$db->exec("CREATE TABLE IF NOT EXISTS `hjk_contact_messages` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `subject` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_contact_email` (`email`),
    INDEX `idx_contact_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$ip = $_SERVER['REMOTE_ADDR'] ?? null;

// Simple flood protection: max 5 submissions per IP in the last hour
if ($ip) {
    $floodStmt = $db->prepare('SELECT COUNT(*) FROM hjk_contact_messages WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
    $floodStmt->execute([$ip]);
    if ((int)$floodStmt->fetchColumn() >= 5) {
        Response::error('Too many messages sent recently. Please try again later.', 429);
    }
}

$db->prepare('INSERT INTO hjk_contact_messages (name, email, phone, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
   ->execute([$name, $email, $phone ?: null, $subject, $message, $ip]);

$adminEmail = Env::get('ADMIN_EMAIL');
if ($adminEmail) {
    $safeName = htmlspecialchars($name);
    $safeEmail = htmlspecialchars($email);
    $safePhone = htmlspecialchars($phone ?: 'Not provided');
    $safeSubject = htmlspecialchars($subject);
    $safeMessage = nl2br(htmlspecialchars($message));

    $appUrl = rtrim(Env::get('APP_URL', ''), '/');
    $logoUrl = $appUrl . '/assets/logo/hjklogo.webp';

    $html = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
            <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <tr><td style="background:#1A1A2E;padding:20px;text-align:center;">
                        <img src="' . $logoUrl . '" alt="HJK Collections" style="height:60px;width:auto;display:inline-block;background:#fff;padding:6px 10px;border-radius:8px;">
                    </td></tr>
                    <tr><td style="padding:30px;">
                        <h2 style="color:#1A1A2E;margin:0 0 10px;">New Contact Message</h2>
                        <p style="color:#666;margin:0 0 20px;">You have received a new message from the contact form.</p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:8px;padding:15px;">
                            <tr><td style="padding:8px;color:#888;width:110px;">Name:</td><td style="padding:8px;color:#1A1A2E;font-weight:600;">' . $safeName . '</td></tr>
                            <tr><td style="padding:8px;color:#888;">Email:</td><td style="padding:8px;"><a href="mailto:' . $safeEmail . '" style="color:#1A1A2E;">' . $safeEmail . '</a></td></tr>
                            <tr><td style="padding:8px;color:#888;">Phone:</td><td style="padding:8px;color:#1A1A2E;">' . $safePhone . '</td></tr>
                            <tr><td style="padding:8px;color:#888;">Subject:</td><td style="padding:8px;color:#1A1A2E;">' . $safeSubject . '</td></tr>
                        </table>
                        <div style="margin-top:20px;padding:18px;background:#fff;border-left:4px solid #C9A96E;border-radius:4px;">
                            <p style="margin:0 0 5px;color:#888;font-size:13px;">Message:</p>
                            <p style="margin:0;color:#333;line-height:1.6;">' . $safeMessage . '</p>
                        </div>
                    </td></tr>
                </table>
            </td></tr>
        </table>
    </body></html>';

    $mailer = new Mailer();
    $mailer->send($adminEmail, 'New Contact Message: ' . $subject, $html, $email);
}

Response::success(null, 'Thank you! Your message has been sent. We will get back to you soon.');
