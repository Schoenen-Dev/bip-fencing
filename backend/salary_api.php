<?php
// salary_api.php
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

$action          = $_GET['action'] ?? '';
$effectiveBranch = getEffectiveBranchId($authUser);

// ─────────────────────────────────────────────────────────────
// GET employees
// ─────────────────────────────────────────────────────────────
if ($action === 'employees') {
    if ($effectiveBranch !== null) {
        $stmt = $conn->prepare(
            'SELECT emp_id, employee_name AS emp_name
               FROM employees
              WHERE branch_id = ?
              ORDER BY employee_name'
        );
        $stmt->bind_param('i', $effectiveBranch);
    } else {
        $stmt = $conn->prepare(
            'SELECT emp_id, employee_name AS emp_name
               FROM employees
              ORDER BY employee_name'
        );
    }
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

// ─────────────────────────────────────────────────────────────
// GET salary records
// ─────────────────────────────────────────────────────────────
if ($action === 'records') {
    if ($effectiveBranch !== null) {
        $stmt = $conn->prepare(
            'SELECT id, employeeName, employeeId, salary,
                    paid, balance, type, salary_date, created_at
               FROM salaries
              WHERE branch_id = ?
              ORDER BY id DESC'
        );
        $stmt->bind_param('i', $effectiveBranch);
    } else {
        $stmt = $conn->prepare(
            'SELECT id, employeeName, employeeId, salary,
                    paid, balance, type, salary_date, created_at
               FROM salaries
              ORDER BY id DESC'
        );
    }
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

// ─────────────────────────────────────────────────────────────
// GET branch budget totals
// ─────────────────────────────────────────────────────────────
if ($action === 'branch_total') {
    if ($effectiveBranch === null) {
        $totalBranch = $conn->query(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM branch_amounts"
        )->fetch_assoc()['total'];

        $totalPaid = $conn->query(
            "SELECT COALESCE(SUM(paid), 0) AS total FROM salaries"
        )->fetch_assoc()['total'];
    } else {
        $stmt = $conn->prepare(
            "SELECT COALESCE(SUM(amount), 0) AS total
               FROM branch_amounts WHERE branch_id = ?"
        );
        $stmt->bind_param('i', $effectiveBranch);
        $stmt->execute();
        $totalBranch = $stmt->get_result()->fetch_assoc()['total'];
        $stmt->close();

        $stmt = $conn->prepare(
            "SELECT COALESCE(SUM(paid), 0) AS total
               FROM salaries WHERE branch_id = ?"
        );
        $stmt->bind_param('i', $effectiveBranch);
        $stmt->execute();
        $totalPaid = $stmt->get_result()->fetch_assoc()['total'];
        $stmt->close();
    }

    $available = $totalBranch - $totalPaid;
    echo json_encode([
        'total_branch_amount' => (float)$totalBranch,
        'total_paid_salaries' => (float)$totalPaid,
        'available_balance'   => (float)$available,
    ]);
    exit;
}

// ─────────────────────────────────────────────────────────────
// POST save salary
// branch_id is resolved from the EMPLOYEE record — this
// guarantees a valid FK value and avoids the constraint error.
// ─────────────────────────────────────────────────────────────
if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit;
    }

    $employeeId = trim($data['employeeId'] ?? '');
    if (!$employeeId) {
        echo json_encode(['success' => false, 'message' => 'No employee selected.']);
        exit;
    }

    // ── Resolve branch_id from the employee (guaranteed valid FK) ──
    $stmt = $conn->prepare(
        "SELECT branch_id FROM employees WHERE emp_id = ? LIMIT 1"
    );
    $stmt->bind_param('s', $employeeId);
    $stmt->execute();
    $empRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$empRow) {
        echo json_encode(['success' => false, 'message' => 'Employee not found.']);
        exit;
    }
    if (empty($empRow['branch_id'])) {
        echo json_encode(['success' => false, 'message' => 'This employee has no branch assigned. Please assign a branch to the employee first.']);
        exit;
    }

    $branchId = (int)$empRow['branch_id'];

    // ── Budget check ───────────────────────────────────────────────
    $stmt = $conn->prepare(
        "SELECT COALESCE(SUM(amount), 0) AS total
           FROM branch_amounts WHERE branch_id = ?"
    );
    $stmt->bind_param('i', $branchId);
    $stmt->execute();
    $branchTotal = (float)$stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    $stmt = $conn->prepare(
        "SELECT COALESCE(SUM(paid), 0) AS total
           FROM salaries WHERE branch_id = ?"
    );
    $stmt->bind_param('i', $branchId);
    $stmt->execute();
    $totalPaid = (float)$stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    $available = $branchTotal - $totalPaid;
    $paid      = (float)($data['paid'] ?? 0);

    if ($paid > $available) {
        echo json_encode([
            'success' => false,
            'message' => 'Insufficient branch budget. Available: ₹' . number_format($available, 2),
        ]);
        exit;
    }

    // ── Insert ─────────────────────────────────────────────────────
    $employeeName = $conn->real_escape_string($data['employeeName'] ?? '');
    $salary       = (float)($data['salary']  ?? 0);
    $balance      = (float)($data['balance'] ?? 0);
    $type         = $conn->real_escape_string($data['type'] ?? '');
    $date         = $conn->real_escape_string($data['date'] ?? '');

    $stmt = $conn->prepare(
        "INSERT INTO salaries
            (employeeName, employeeId, salary, paid, balance, type, salary_date, branch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        'ssdddssi',
        $employeeName, $employeeId, $salary, $paid, $balance, $type, $date, $branchId
    );

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