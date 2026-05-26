<?php
// =============================================================
//  employees.php
//  Called by: Attendance.jsx → useEffect (GET)
//  Returns { employees: [ { emp_id, emp_name }, ... ] }
//  so the "Select employee" dropdown in Attendance.jsx is
//  populated from the live employees table.
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
    'SELECT emp_id, employee_name AS emp_name
     FROM employees
     ORDER BY employee_name ASC'
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

// Attendance.jsx reads:  data.employees  — so wrap in object
echo json_encode(['employees' => $employees]);

$result->free();
$db->close();
