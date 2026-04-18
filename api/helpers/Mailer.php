<?php

class Mailer
{
    private $fromEmail;
    private $fromName;

    public function __construct()
    {
        $appUrl = Env::get('APP_URL', '');
        $host = $appUrl ? parse_url($appUrl, PHP_URL_HOST) : '';
        $defaultFrom = $host ? 'no-reply@' . $host : 'no-reply@localhost';

        $this->fromEmail = Env::get('MAIL_FROM_EMAIL', Env::get('SMTP_FROM_EMAIL', $defaultFrom));
        $this->fromName = Env::get('MAIL_FROM_NAME', Env::get('SMTP_FROM_NAME', 'HJK Collections'));
    }

    /**
     * Send an HTML email using the server's mail() function (no SMTP).
     */
    public function send($to, $subject, $htmlBody, $replyTo = null)
    {
        $recipients = is_array($to) ? implode(', ', $to) : $to;

        $boundary = md5(uniqid((string)time(), true));

        $fromName = $this->encodeHeader($this->fromName);
        $fromEmail = $this->fromEmail;

        $headers = [];
        $headers[] = "From: {$fromName} <{$fromEmail}>";
        $headers[] = "Reply-To: " . ($replyTo ?: $fromEmail);
        $headers[] = "Return-Path: <{$fromEmail}>";
        $headers[] = "MIME-Version: 1.0";
        $headers[] = "Content-Type: multipart/alternative; boundary=\"{$boundary}\"";
        $headers[] = "X-Mailer: HJKCollections";

        $plainText = strip_tags(str_replace(
            ['<br>', '<br/>', '<br />', '</p>', '</div>', '</tr>'],
            "\n",
            $htmlBody
        ));
        $plainText = trim(html_entity_decode($plainText, ENT_QUOTES, 'UTF-8'));

        $body  = "--{$boundary}\r\n";
        $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $plainText . "\r\n\r\n";
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $htmlBody . "\r\n\r\n";
        $body .= "--{$boundary}--\r\n";

        $subjectEncoded = $this->encodeHeader($subject);
        $additionalParams = '-f' . $fromEmail;

        try {
            $ok = @mail($recipients, $subjectEncoded, $body, implode("\r\n", $headers), $additionalParams);
            if (!$ok) {
                error_log('Mailer: mail() returned false for ' . $recipients);
            }
            return (bool)$ok;
        } catch (Exception $e) {
            error_log('Mailer: ' . $e->getMessage());
            return false;
        }
    }

    private function encodeHeader($text)
    {
        if (preg_match('/[^\x20-\x7e]/', $text)) {
            return '=?UTF-8?B?' . base64_encode($text) . '?=';
        }
        return $text;
    }
}
