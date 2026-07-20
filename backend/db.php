<?php
// =============================================================
//  db.php — mysqli connection (used by products.php, client.php, etc.)
// =============================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'bipfencing');
define('DB_USER', 'root');
define('DB_PASS', '');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed: ' . $conn->connect_error]);
    exit;
}

$conn->set_charset('utf8mb4');

function getDB() {
    global $conn;
    return $conn;
}
