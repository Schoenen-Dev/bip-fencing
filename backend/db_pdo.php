<?php
// =============================================================
//  db_pdo.php — PDO connection (used by auth_middleware + login)
//  Your existing db.php (mysqli) stays unchanged.
// =============================================================

define('PDO_HOST',    '127.0.0.1');
define('PDO_PORT',    3307);                   // XAMPP MySQL is running on 3307, not 3306
define('PDO_DB',      'bipfencing');
define('PDO_USER',    'root');
define('PDO_PASS',    '');
define('PDO_CHARSET', 'utf8mb4');

try {
    $pdo = new PDO(
        "mysql:host=" . PDO_HOST . ";port=" . PDO_PORT . ";dbname=" . PDO_DB . ";charset=" . PDO_CHARSET,
        PDO_USER,
        PDO_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}