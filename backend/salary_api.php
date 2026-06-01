<?php
// =============================================================
//  salary_api.php — with branch auth
// =============================================================

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

// ── employees list ────────────────────────────────────────────
if ($action === 'employees') {
    $sql    = 'SELECT emp_id, employee_name AS emp_name FROM employees';
    $params = []; $types = '';
    if ($authUser['role'] !== 'admin') {
        $sql .= ' WHERE branch_id = ?'; $params = [(int)$authUser['branch_id']]; $types = 'i';
    }
    $sql .= ' ORDER BY employee_name';
    $stmt = $conn->prepare($sql);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

// ── salary records ────────────────────────────────────────────
if ($action === 'records') {
    $sql    = 'SELECT id, employeeName, employeeId, salary, paid, balance, type, salary_date, created_at FROM salaries';
    $params = []; $types = '';
    if ($authUser['role'] !== 'admin') {
        $sql .= ' WHERE branch_id = ?'; $params = [(int)$authUser['branch_id']]; $types = 'i';
    }
    $sql .= ' ORDER BY id DESC';
    $stmt = $conn->prepare($sql);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

// ── save salary ───────────────────────────────────────────────
if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) { echo json_encode(['success' => false, 'message' => 'No data']); exit; }

    $branchId     = $authUser['role'] === 'admin'
        ? (int)($data['branch_id'] ?? $authUser['branch_id'])
        : (int)$authUser['branch_id'];
    $employeeName = $conn->real_escape_string($data['employeeName'] ?? '');
    $employeeId   = $conn->real_escape_string($data['employeeId']   ?? '');
    $salary       = floatval($data['salary']  ?? 0);
    $paid         = floatval($data['paid']    ?? 0);
    $balance      = floatval($data['balance'] ?? 0);
    $type         = $conn->real_escape_string($data['type'] ?? '');
    $date         = $conn->real_escape_string($data['date'] ?? '');

    $stmt = $conn->prepare(
        'INSERT INTO salaries (employeeName, employeeId, salary, paid, balance, type, salary_date, branch_id) VALUES (?,?,?,?,?,?,?,?)'
    );
    $stmt->bind_param('ssdddssi', $employeeName, $employeeId, $salary, $paid, $balance, $type, $date, $branchId);

    if ($stmt->execute()) { echo json_encode(['success' => true, 'message' => 'Salary saved']); }
    else { echo json_encode(['success' => false, 'message' => $stmt->error]); }
    $stmt->close(); exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);