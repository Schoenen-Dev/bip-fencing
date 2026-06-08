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

// 🔧 Get branch_id from employees table using emp_id (or emp_name as fallback)
$branchId = null;
$stmtEmp = $conn->prepare("SELECT branch_id FROM employees WHERE emp_id = ? OR employee_name = ? LIMIT 1");
$stmtEmp->bind_param('ss', $emp_id, $emp_name);
$stmtEmp->execute();
$resultEmp = $stmtEmp->get_result();
if ($row = $resultEmp->fetch_assoc()) {
    $branchId = (int)$row['branch_id'];
}
$stmtEmp->close();

if (!$branchId) {
    http_response_code(400);
    echo json_encode(['message' => 'Employee not found or branch not assigned']);
    exit;
}

// Insert OT record
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