<?php
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); echo json_encode(['message' => 'Method not allowed']); exit;
}

$sql    = 'SELECT id, emp_name, emp_id, salary_type, start_time, end_time, total_ot_hours, ot_date, created_at FROM ot_details';
$params = []; $types = '';

if ($authUser['role'] !== 'admin') {
    $sql .= ' WHERE branch_id = ?';
    $params = [(int)$authUser['branch_id']];
    $types  = 'i';
}
$sql .= ' ORDER BY id DESC';

$stmt = $conn->prepare($sql);
if ($params) $stmt->bind_param($types, ...$params);
$stmt->execute();
$records = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode($records);
$conn->close();