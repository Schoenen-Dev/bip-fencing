<?php
// =============================================================
//  get_employees.php — with admin branch impersonation
// =============================================================

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

$db = getDB();

list($whereClause, $params) = branchFilter($authUser);

$sql = "SELECT id, employee_name, emp_id, department, salary_type, date_of_joining, created_at FROM employees $whereClause ORDER BY created_at DESC";

$stmt = $db->prepare($sql);
if ($params) {
    $stmt->bind_param(str_repeat('i', count($params)), ...$params);
}
$stmt->execute();
$employees = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

echo json_encode($employees);
$stmt->close();
$db->close();
?>