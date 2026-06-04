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

$data = json_decode(file_get_contents('php://input'), true);
$branch_id   = (int)($data['branch_id'] ?? 0);
$branch_name = trim($data['branch_name'] ?? '');   // for display if needed, but we use branch_id
$amount      = $data['amount'] ?? '';
$payment_date= $data['payment_date'] ?? '';
$note        = $data['note'] ?? '';

if (!$branch_id || $amount === '' || empty($payment_date)) {
    http_response_code(400); echo json_encode(['message' => 'Branch ID, amount and date are required']); exit;
}

// Optional: validate branch_id exists
$check = $conn->prepare("SELECT id FROM branches WHERE id = ?");
$check->bind_param('i', $branch_id);
$check->execute();
if (!$check->get_result()->fetch_assoc()) {
    http_response_code(400); echo json_encode(['message' => 'Invalid branch ID']); exit;
}

$stmt = $conn->prepare('INSERT INTO branch_amounts (branch_id, branch_name, amount, payment_date, note) VALUES (?, ?, ?, ?, ?)');
$stmt->bind_param('isdss', $branch_id, $branch_name, $amount, $payment_date, $note);

if ($stmt->execute()) {
    echo json_encode(['message' => 'Branch amount saved successfully']);
} else {
    http_response_code(500); echo json_encode(['message' => 'Execute failed', 'error' => $stmt->error]);
}
$stmt->close();
$conn->close();
?>