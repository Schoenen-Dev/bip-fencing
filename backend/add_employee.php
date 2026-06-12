<?php
// =============================================================
//  add_employee.php — with branch auth
// =============================================================

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) { http_response_code(400); echo json_encode(['error' => 'Invalid JSON']); exit; }

foreach (['employee_name','emp_id','department','salary_type','date_of_joining'] as $f) {
    if (empty(trim((string)($body[$f] ?? '')))) {
        http_response_code(422); echo json_encode(['error' => "Field '$f' is required"]); exit;
    }
}

$name    = trim($body['employee_name']);
$empId   = trim($body['emp_id']);
$dept    = trim($body['department']);
$salType = trim($body['salary_type']);
$doj     = trim($body['date_of_joining']);
$phone   = isset($body['phone_number']) && trim((string)$body['phone_number']) !== '' ? trim((string)$body['phone_number']) : null;
$address = isset($body['address']) && trim((string)$body['address']) !== '' ? trim((string)$body['address']) : null;

if (!in_array($salType, ['monthly','weekly','daily'], true)) {
    http_response_code(422); echo json_encode(['error' => 'Invalid salary_type']); exit;
}

// Branch user always writes to their own branch; admin can pass branch_id in body
$branchId = $authUser['role'] === 'admin'
    ? (int)($body['branch_id'] ?? $authUser['branch_id'])
    : (int)$authUser['branch_id'];

$db   = getDB();
$stmt = $db->prepare(
    'INSERT INTO employees (employee_name, emp_id, department, salary_type, date_of_joining, branch_id, phone_number, address) VALUES (?,?,?,?,?,?,?,?)'
);
$stmt->bind_param('sssssiss', $name, $empId, $dept, $salType, $doj, $branchId, $phone, $address);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode(['success' => true, 'id' => $db->insert_id]);
} else {
    $code = $db->errno === 1062 ? 409 : 500;
    http_response_code($code);
    echo json_encode(['error' => $db->errno === 1062 ? "Employee ID '$empId' already exists" : $db->error]);
}
$stmt->close(); $db->close();