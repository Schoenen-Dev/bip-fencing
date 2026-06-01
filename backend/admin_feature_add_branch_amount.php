<?php
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

// Admin only
if ($authUser['role'] !== 'admin') {
    http_response_code(403); echo json_encode(['message' => 'Admin access required']); exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['message' => 'Method not allowed']); exit;
}

$data         = json_decode(file_get_contents('php://input'), true);
$branch_name  = $data['branch_name']  ?? '';
$amount       = $data['amount']       ?? '';
$payment_date = $data['payment_date'] ?? '';
$note         = $data['note']         ?? '';

if (empty($branch_name) || $amount === '' || empty($payment_date)) {
    http_response_code(400); echo json_encode(['message' => 'Branch name, amount and date are required']); exit;
}

$stmt = $conn->prepare('INSERT INTO branch_amounts (branch_name, amount, payment_date, note) VALUES (?, ?, ?, ?)');
$stmt->bind_param('sdss', $branch_name, $amount, $payment_date, $note);

if ($stmt->execute()) {
    echo json_encode(['message' => 'Branch amount saved successfully']);
} else {
    http_response_code(500); echo json_encode(['message' => 'Execute failed', 'error' => $stmt->error]);
}
$stmt->close();
$conn->close();