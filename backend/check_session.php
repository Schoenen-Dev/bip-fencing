<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db_pdo.php';

header('Content-Type: application/json');

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

$response = ['success' => false];

if ($token) {
    $stmt = $pdo->prepare(
        "SELECT u.id, u.username, u.role, u.branch_id, u.full_name
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.id = ?
         LIMIT 1"
    );
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if ($user) {
        $response['success'] = true;
        $response['user'] = $user;
    }
}

echo json_encode($response);