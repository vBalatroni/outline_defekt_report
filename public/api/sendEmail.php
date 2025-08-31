<?php
// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");         
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// IMPORTANT: Install PHPMailer via Composer by running 'composer require phpmailer/phpmailer' in your project root.
require '../../vendor/autoload.php';

// --- Configuration ---
// IMPORTANT: Create a file named 'email_config.php' in a secure location (e.g., one level above the project root)
// and define your SMTP credentials there.
// Example for email_config.php:
/*
<?php
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_USERNAME', 'your_email@yourdomain.com');
define('SMTP_PASSWORD', 'your_google_app_password'); // Use a Google App Password
define('SMTP_PORT', 587);
define('SMTP_SECURE', PHPMailer::ENCRYPTION_STARTTLS);
define('FROM_EMAIL', 'your_email@yourdomain.com');
define('FROM_NAME', 'Defekt Report System');
*/
@include_once '../../email_config.php'; // The @ suppresses errors if the file doesn't exist yet.

header('Content-Type: application/json');

function send_email($to, $subject, $htmlBody, $attachments = []) {
    // Check if configuration is loaded.
    if (!defined('SMTP_HOST')) {
        return ['success' => false, 'message' => 'Email configuration is missing or invalid. Please create and configure email_config.php.'];
    }

    $mail = new PHPMailer(true);

    try {
        //Server settings
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USERNAME;
        $mail->Password   = SMTP_PASSWORD;
        $mail->SMTPSecure = SMTP_SECURE;
        $mail->Port       = SMTP_PORT;

        //Recipients
        $mail->setFrom(FROM_EMAIL, FROM_NAME);
        $mail->addAddress($to);

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = 'Please use an HTML-compatible email client to view this message.';

        // Attachments
        foreach ($attachments as $attachment) {
            $mail->addStringAttachment($attachment['content'], $attachment['filename']);
        }

        $mail->send();
        return ['success' => true, 'message' => 'Email sent successfully to ' . $to];
    } catch (Exception $e) {
        // Return a detailed error message for easier debugging.
        return ['success' => false, 'message' => "Message could not be sent. Mailer Error: {$mail->ErrorInfo}"];
    }
}

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON received.']);
    exit;
}

$supplierHtml = $input['supplierHtml'] ?? null;
$customerHtml = $input['customerHtml'] ?? null;
$supplierRecipient = $input['supplierRecipient'] ?? null;
$customerRecipient = $input['customerRecipient'] ?? null;
$testRecipient = $input['testRecipient'] ?? null;


if (!$supplierHtml || !$customerHtml || !$supplierRecipient || !$customerRecipient) {
    echo json_encode(['success' => false, 'message' => 'Missing required email data.']);
    exit;
}

$responses = [];
$finalRecipientSupplier = !empty($testRecipient) ? $testRecipient : $supplierRecipient;
$finalRecipientCustomer = !empty($testRecipient) ? $testRecipient : $customerRecipient;

// Send Supplier Email
$responses[] = send_email(
    $finalRecipientSupplier,
    'New Defekt Report - Supplier Details',
    $supplierHtml
);

// Send Customer Email
$responses[] = send_email(
    $finalRecipientCustomer,
    'Your Defekt Report Summary',
    $customerHtml
);

// Check results
$all_successful = true;
foreach ($responses as $response) {
    if (!$response['success']) {
        $all_successful = false;
    }
}

if ($all_successful) {
    echo json_encode(['success' => true, 'message' => 'All emails sent successfully.', 'details' => $responses]);
} else {
    // Combine error messages
    $error_messages = array_map(function($r) { return $r['message']; }, array_filter($responses, function($r) { return !$r['success']; }));
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'One or more emails failed to send.', 'errors' => $error_messages, 'details' => $responses]);
} 