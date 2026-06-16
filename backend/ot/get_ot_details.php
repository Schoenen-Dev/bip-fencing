<?php
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

list($whereClause, $params) = branchFilter($authUser);

$sql = "SELECT id, emp_name, emp_id, salary_type, start_time, end_time, total_ot_hours, ot_salary, ot_date, created_at 
        FROM ot_details $whereClause ORDER BY id DESC";

$stmt = $conn->prepare($sql);
if ($params) {
    $types = str_repeat('i', count($params));
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$records = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode($records);
$conn->close();
?>