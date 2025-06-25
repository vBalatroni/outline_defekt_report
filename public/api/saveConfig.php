<?php
// Set headers
header('Content-Type: application/json');

// Check for POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Get the raw POST data
$jsonPayload = file_get_contents('php://input');

// Try to decode the JSON
$data = json_decode($jsonPayload);

// Check if JSON is valid
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data provided.']);
    exit;
}

// Define the file path.
// This assumes the script is in /public/api/ and the target is in /src/assets/
$filePath = realpath(__DIR__ . '/../../src/assets/productData.json');

if ($filePath === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error resolving file path. The file productData.json could not be found.']);
    exit;
}

if (!is_writable(dirname($filePath)) || (file_exists($filePath) && !is_writable($filePath))) {
     http_response_code(500);
     echo json_encode(['success' => false, 'message' => 'The destination path is not writable. Check server permissions for the file and its directory.']);
     exit;
}

// Re-encode with pretty print for readability
$formattedJson = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

// Write to the file
if (file_put_contents($filePath, $formattedJson) === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'Failed to write to file. Check server permissions.']);
} else {
    echo json_encode(['success' => true, 'message' => 'Configuration saved successfully.']);
}

?> 