<?php
// =============================================================
//  add_employee.php
//  Called by: Employee_details.jsx → handleSubmit (POST)
//  Stores a new employee row in the `employees` table.
// =============================================================

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Read JSON body
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!$body) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

// Required fields
$required = ['employee_name', 'emp_id', 'department', 'salary_type', 'date_of_joining'];
foreach ($required as $field) {
    if (empty(trim((string)($body[$field] ?? '')))) {
        http_response_code(422);
        echo json_encode(['error' => "Field '$field' is required"]);
        exit;
    }
}

$name    = trim($body['employee_name']);
$empId   = trim($body['emp_id']);
$dept    = trim($body['department']);
$salType = trim($body['salary_type']);
$doj     = trim($body['date_of_joining']);

// Validate salary_type enum value
$validSalary = ['monthly', 'weekly', 'daily'];
if (!in_array($salType, $validSalary, true)) {
    http_response_code(422);
    echo json_encode(['error' => 'salary_type must be monthly, weekly, or daily']);
    exit;
}

$db   = getDB();
$stmt = $db->prepare(
    'INSERT INTO employees (employee_name, emp_id, department, salary_type, date_of_joining)
     VALUES (?, ?, ?, ?, ?)'
);
$stmt->bind_param('sssss', $name, $empId, $dept, $salType, $doj);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Employee added successfully',
        'id'      => $db->insert_id,
    ]);
} else {
    // Duplicate emp_id → unique constraint violation
    if ($db->errno === 1062) {
        http_response_code(409);
        echo json_encode(['error' => "Employee ID '$empId' already exists"]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save employee: ' . $db->error]);
    }
}

$stmt->close();
$db->close();
