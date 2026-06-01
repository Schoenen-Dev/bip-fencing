<?php
// ============================================================
//  File: api/db.php
//  Place this inside: C:\xampp\htdocs\inventory\api\db.php
// ============================================================

$host   = 'localhost';
$db     = 'inventory_db';   // Your database name
$user   = 'root';           // Default XAMPP MySQL user
$pass   = '';               // Default XAMPP MySQL password (empty)
$port   = 3306;

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
