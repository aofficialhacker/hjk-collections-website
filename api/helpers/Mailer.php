<?php

class Mailer
{
    private $host;
    private $port;
    private $user;
    private $pass;
    private $fromEmail;
    private $fromName;

    public function __construct()
    {
        $this->host = Env::get('SMTP_HOST', 'smtp.gmail.com');
        $this->port = (int)Env::get('SMTP_PORT', 587);
        $this->user = Env::get('SMTP_USER', '');
        $this->pass = Env::get('SMTP_PASS', '');
        $this->fromEmail = Env::get('SMTP_FROM_EMAIL', $this->user);
        $this->fromName = Env::get('SMTP_FROM_NAME', 'HJK Collections');
    }

    /**
     * Send an HTML email via SMTP
     */
    public function send($to, $subject, $htmlBody)
    {
        if (!$this->user || !$this->pass) {
            error_log('Mailer: SMTP credentials not configured');
            return false;
        }

        try {
            $socket = @fsockopen(
                'tls://' . $this->host,
                $this->port === 465 ? 465 : 587,
                $errno, $errstr, 15
            );

            // For port 587, use STARTTLS
            if (!$socket && $this->port === 587) {
                $socket = @fsockopen($this->host, 587, $errno, $errstr, 15);
                if (!$socket) {
                    error_log("Mailer: Connection failed - $errstr ($errno)");
                    return false;
                }
                $this->readResponse($socket);
                $this->sendCommand($socket, "EHLO " . gethostname());
                $this->sendCommand($socket, "STARTTLS");

                $crypto = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT);
                if (!$crypto) {
                    error_log('Mailer: STARTTLS failed');
                    fclose($socket);
                    return false;
                }
            }

            if (!$socket) {
                error_log("Mailer: Connection failed - $errstr ($errno)");
                return false;
            }

            // Read greeting
            if ($this->port === 465 || $this->port === 587) {
                $this->readResponse($socket);
            }

            // EHLO
            $this->sendCommand($socket, "EHLO " . gethostname());

            // AUTH LOGIN
            $this->sendCommand($socket, "AUTH LOGIN");
            $this->sendCommand($socket, base64_encode($this->user));
            $authResp = $this->sendCommand($socket, base64_encode($this->pass));

            if (strpos($authResp, '235') === false) {
                error_log('Mailer: Authentication failed');
                fclose($socket);
                return false;
            }

            // MAIL FROM
            $this->sendCommand($socket, "MAIL FROM:<{$this->fromEmail}>");

            // RCPT TO (support multiple recipients)
            $recipients = is_array($to) ? $to : [$to];
            foreach ($recipients as $recipient) {
                $this->sendCommand($socket, "RCPT TO:<{$recipient}>");
            }

            // DATA
            $this->sendCommand($socket, "DATA");

            // Build message
            $toHeader = is_array($to) ? implode(', ', $to) : $to;
            $boundary = md5(uniqid(time()));
            $headers = "From: {$this->fromName} <{$this->fromEmail}>\r\n";
            $headers .= "To: {$toHeader}\r\n";
            $headers .= "Subject: {$subject}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
            $headers .= "X-Mailer: HJKCollections\r\n";
            $headers .= "\r\n";

            // Plain text version
            $plainText = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</div>', '</tr>'], "\n", $htmlBody));
            $plainText = html_entity_decode($plainText, ENT_QUOTES, 'UTF-8');

            $body = "--{$boundary}\r\n";
            $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
            $body .= $plainText . "\r\n";
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
            $body .= $htmlBody . "\r\n";
            $body .= "--{$boundary}--\r\n";

            $message = $headers . $body . "\r\n.";
            $this->sendCommand($socket, $message);

            // QUIT
            $this->sendCommand($socket, "QUIT");
            fclose($socket);

            return true;

        } catch (Exception $e) {
            error_log('Mailer: ' . $e->getMessage());
            return false;
        }
    }

    private function sendCommand($socket, $command)
    {
        fwrite($socket, $command . "\r\n");
        return $this->readResponse($socket);
    }

    private function readResponse($socket)
    {
        $response = '';
        stream_set_timeout($socket, 10);
        while ($line = fgets($socket, 512)) {
            $response .= $line;
            // If 4th character is a space, it's the last line
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $response;
    }
}
