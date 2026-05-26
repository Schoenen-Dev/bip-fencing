<?php
// =============================================================
//  get_employees.php
//  Called by: Employee_details.jsx → fetchEmployees (GET)
//  Returns all employee records for the "Employee Records" tab.
// =============================================================

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$db     = getDB();
$result = $db->query(
    'SELECT id, employee_name, emp_id, department, salary_type, date_of_joining, created_at
     FROM employees
     ORDER BY created_at DESC'
);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed: ' . $db->error]);
    $db->close();
    exit;
}

$employees = [];
while ($row = $result->fetch_assoc()) {
    $employees[] = $row;
}

echo json_encode($employees);   // plain array — matches what Employee_details.jsx expects

$result->free();
$db->close();
