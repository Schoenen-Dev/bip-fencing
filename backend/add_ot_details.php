<?php
// Start with clean output
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON data']);
    exit;
}

$emp_name       = $data['emp_name']       ?? '';
$emp_id         = $data['emp_id']         ?? '';
$salary_type    = $data['salary_type']    ?? '';
$start_time     = $data['start_time']     ?? '';
$end_time       = $data['end_time']       ?? '';
$total_ot_hours = $data['total_ot_hours'] ?? '';
$ot_date        = $data['ot_date']        ?? '';

if (empty($emp_name) || empty($emp_id) || empty($salary_type) ||
    empty($start_time) || empty($end_time) || $total_ot_hours === '' || empty($ot_date)) {
    http_response_code(400);
    echo json_encode(['message' => 'All fields are required']);
    exit;
}

$branchId = $authUser['role'] === 'admin'
    ? (int)($data['branch_id'] ?? $authUser['branch_id'])
    : (int)$authUser['branch_id'];

$stmt = $conn->prepare(
    'INSERT INTO ot_details (emp_name, emp_id, salary_type, start_time, end_time, total_ot_hours, ot_date, branch_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['message' => 'Prepare failed', 'error' => $conn->error]);
    exit;
}

$stmt->bind_param('sssssssi', $emp_name, $emp_id, $salary_type, $start_time, $end_time, $total_ot_hours, $ot_date, $branchId);

if ($stmt->execute()) {
    echo json_encode(['message' => 'OT details saved successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Execute failed', 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>