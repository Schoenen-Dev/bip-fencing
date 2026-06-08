<?php
// salary_api.php - final version with correct all-branches totals
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

function getEffectiveBranchId($user): ?int {
    if ($user['role'] === 'admin' && isset($user['view_branch_id']) && $user['view_branch_id'] !== null) {
        return (int)$user['view_branch_id'];
    }
    if ($user['role'] !== 'admin' && isset($user['branch_id']) && $user['branch_id'] !== null) {
        return (int)$user['branch_id'];
    }
    return null;
}

$action = $_GET['action'] ?? '';
$effectiveBranch = getEffectiveBranchId($authUser);

if ($action === 'employees') {
    $sql = 'SELECT emp_id, employee_name AS emp_name FROM employees';
    $params = [];
    $types = '';
    if ($effectiveBranch !== null) {
        $sql .= ' WHERE branch_id = ?';
        $params[] = $effectiveBranch;
        $types = 'i';
    }
    $sql .= ' ORDER BY employee_name';
    $stmt = $conn->prepare($sql);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

if ($action === 'records') {
    $sql = 'SELECT id, employeeName, employeeId, salary, paid, balance, type, salary_date, created_at FROM salaries';
    $params = [];
    $types = '';
    if ($effectiveBranch !== null) {
        $sql .= ' WHERE branch_id = ?';
        $params[] = $effectiveBranch;
        $types = 'i';
    }
    $sql .= ' ORDER BY id DESC';
    $stmt = $conn->prepare($sql);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

if ($action === 'branch_total') {
    if ($effectiveBranch === null) {
        // Admin viewing all branches: sum across all
        $totalBranch = $conn->query("SELECT COALESCE(SUM(amount), 0) AS total FROM branch_amounts")->fetch_assoc()['total'];
        $totalPaid = $conn->query("SELECT COALESCE(SUM(paid), 0) AS total FROM salaries")->fetch_assoc()['total'];
    } else {
        $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM branch_amounts WHERE branch_id = ?");
        $stmt->bind_param('i', $effectiveBranch);
        $stmt->execute();
        $totalBranch = $stmt->get_result()->fetch_assoc()['total'];
        $stmt->close();

        $stmt = $conn->prepare("SELECT COALESCE(SUM(paid), 0) AS total FROM salaries WHERE branch_id = ?");
        $stmt->bind_param('i', $effectiveBranch);
        $stmt->execute();
        $totalPaid = $stmt->get_result()->fetch_assoc()['total'];
        $stmt->close();
    }
    $available = $totalBranch - $totalPaid;
    echo json_encode([
        'total_branch_amount' => (float)$totalBranch,
        'total_paid_salaries' => (float)$totalPaid,
        'available_balance'   => (float)$available
    ]);
    exit;
}

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) { echo json_encode(['success' => false, 'message' => 'No data']); exit; }

    $branchId = $effectiveBranch;
    if ($branchId === null && $authUser['role'] === 'admin') {
        $branchId = (int)($data['branch_id'] ?? 0);
    }
    if (!$branchId) {
        echo json_encode(['success' => false, 'message' => 'No branch selected. Please select a branch from the topbar.']);
        exit;
    }

    $employeeName = $conn->real_escape_string($data['employeeName'] ?? '');
    $employeeId   = $conn->real_escape_string($data['employeeId'] ?? '');
    $salary       = (float)($data['salary'] ?? 0);
    $paid         = (float)($data['paid'] ?? 0);
    $balance      = (float)($data['balance'] ?? 0);
    $type         = $conn->real_escape_string($data['type'] ?? '');
    $date         = $conn->real_escape_string($data['date'] ?? '');

    // Check available budget for this branch
    $stmt = $conn->prepare("SELECT COALESCE(SUM(paid), 0) AS total_paid FROM salaries WHERE branch_id = ?");
    $stmt->bind_param('i', $branchId);
    $stmt->execute();
    $totalPaid = $stmt->get_result()->fetch_assoc()['total_paid'];
    $stmt->close();

    $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) AS total_branch FROM branch_amounts WHERE branch_id = ?");
    $stmt->bind_param('i', $branchId);
    $stmt->execute();
    $branchTotal = $stmt->get_result()->fetch_assoc()['total_branch'];
    $stmt->close();

    $available = $branchTotal - $totalPaid;
    if ($paid > $available) {
        echo json_encode(['success' => false, 'message' => "Insufficient branch budget. Available: ₹" . number_format($available, 2)]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO salaries (employeeName, employeeId, salary, paid, balance, type, salary_date, branch_id) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->bind_param('ssdddssi', $employeeName, $employeeId, $salary, $paid, $balance, $type, $date, $branchId);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Salary saved']);
    } else {
        echo json_encode(['success' => false, 'message' => $stmt->error]);
    }
    $stmt->close();
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>