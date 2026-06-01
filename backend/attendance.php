<?php
// =============================================================
//  attendance.php  — with branch-level auth
//  Branch user → sees/writes only their branch data
//  Admin       → sees/writes all branches
// =============================================================

require_once __DIR__ . '/auth_middleware.php'; // sets $authUser, $pdo
require_once __DIR__ . '/db.php';              // sets getDB() / $conn (mysqli)

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

function readBody(): array {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON body']);
        exit;
    }
    return $body;
}

function cleanTime(?string $t): ?string {
    if (!$t || !preg_match('/^\d{1,2}:\d{2}(:\d{2})?$/', $t)) return null;
    return $t;
}

// Branch filter for mysqli: returns [extra WHERE conditions string, params array, types string]
function attendanceBranchFilter(array $user): array {
    if ($user['role'] === 'admin') return ['', [], ''];
    return ['AND a.branch_id = ?', [(int)$user['branch_id']], 'i'];
}

// ── GET ───────────────────────────────────────────────────────
if ($method === 'GET') {
    $where  = ['1=1'];
    $params = [];
    $types  = '';

    // Branch restriction
    if ($authUser['role'] !== 'admin') {
        $where[]  = 'a.branch_id = ?';
        $params[] = (int)$authUser['branch_id'];
        $types   .= 'i';
    }

    if (!empty($_GET['date']))   { $where[] = 'a.date = ?';      $params[] = $_GET['date'];   $types .= 's'; }
    if (!empty($_GET['status'])) { $where[] = 'a.status = ?';    $params[] = $_GET['status']; $types .= 's'; }
    if (!empty($_GET['search'])) {
        $like     = '%' . $_GET['search'] . '%';
        $where[]  = '(a.employee_name LIKE ? OR a.employee_id LIKE ?)';
        $params[] = $like; $params[] = $like;
        $types   .= 'ss';
    }
    if (!empty($_GET['tab'])) {
        if ($_GET['tab'] === 'today') $where[] = 'a.date = CURDATE()';
        if ($_GET['tab'] === 'week')  $where[] = 'a.date >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)';
    }

    $whereSQL = 'WHERE ' . implode(' AND ', $where);
    $sql = "SELECT a.id, a.employee_id, a.employee_name, a.date, a.status,
                   a.leave_type, a.check_in, a.check_out, a.work_hours,
                   a.branch_id, a.created_at, a.updated_at
            FROM attendance a
            $whereSQL
            ORDER BY a.date DESC, a.created_at DESC";

    $stmt = $db->prepare($sql);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $records = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Stats scoped to branch
    $branchWhere = $authUser['role'] === 'admin' ? '' : "AND branch_id = {$authUser['branch_id']}";
    $today   = [];
    $allTime = [];
    $res = $db->query("SELECT status, COUNT(*) AS cnt FROM attendance WHERE date = CURDATE() $branchWhere GROUP BY status");
    while ($r = $res->fetch_assoc()) $today[$r['status']] = (int)$r['cnt'];
    $res = $db->query("SELECT status, COUNT(*) AS cnt FROM attendance WHERE 1 $branchWhere GROUP BY status");
    while ($r = $res->fetch_assoc()) $allTime[$r['status']] = (int)$r['cnt'];

    $empWhere = $authUser['role'] === 'admin' ? '' : "WHERE branch_id = {$authUser['branch_id']}";
    $totalEmp = (int)$db->query("SELECT COUNT(*) AS c FROM employees $empWhere")->fetch_assoc()['c'];

    echo json_encode(['records' => $records, 'stats' => ['total_employees' => $totalEmp, 'today' => $today, 'all_time' => $allTime]]);
    $db->close();
    exit;
}

// ── POST ──────────────────────────────────────────────────────
if ($method === 'POST') {
    $body    = readBody();
    $empId   = trim($body['employee_id']   ?? '');
    $empName = trim($body['employee_name'] ?? '');
    $date    = trim($body['date']          ?? '');
    $status  = trim($body['status']        ?? 'Present');
    $leave   = trim($body['leave_type']    ?? '') ?: null;
    $checkIn = cleanTime($body['check_in']  ?? null);
    $checkOut= cleanTime($body['check_out'] ?? null);
    $wh      = is_numeric($body['work_hours'] ?? '') ? (float)$body['work_hours'] : null;

    // Always write to user's own branch (admin can override via body)
    $branchId = $authUser['role'] === 'admin'
        ? (int)($body['branch_id'] ?? $authUser['branch_id'])
        : (int)$authUser['branch_id'];

    if (!$empId || !$empName || !$date) {
        http_response_code(422);
        echo json_encode(['error' => 'employee_id, employee_name and date are required']);
        exit;
    }

    $stmt = $db->prepare(
        'INSERT INTO attendance (employee_id, employee_name, date, status, leave_type, check_in, check_out, work_hours, branch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param('sssssssdi', $empId, $empName, $date, $status, $leave, $checkIn, $checkOut, $wh, $branchId);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(['success' => true, 'id' => $db->insert_id]);
    } else {
        $code = $db->errno === 1062 ? 409 : 500;
        http_response_code($code);
        echo json_encode(['error' => $db->errno === 1062 ? "Attendance already exists for this employee on this date" : $db->error]);
    }
    $stmt->close(); $db->close(); exit;
}

// ── PUT ───────────────────────────────────────────────────────
if ($method === 'PUT') {
    $id   = (int)($_GET['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }

    $body    = readBody();
    $empId   = trim($body['employee_id']   ?? '');
    $empName = trim($body['employee_name'] ?? '');
    $date    = trim($body['date']          ?? '');
    $status  = trim($body['status']        ?? 'Present');
    $leave   = trim($body['leave_type']    ?? '') ?: null;
    $checkIn = cleanTime($body['check_in']  ?? null);
    $checkOut= cleanTime($body['check_out'] ?? null);
    $wh      = is_numeric($body['work_hours'] ?? '') ? (float)$body['work_hours'] : null;

    // Branch users can only edit their own branch's records
    $branchCheck = $authUser['role'] === 'admin' ? 'WHERE id=?' : 'WHERE id=? AND branch_id=?';
    $checkStmt   = $db->prepare("SELECT id FROM attendance $branchCheck");
    if ($authUser['role'] === 'admin') { $checkStmt->bind_param('i', $id); }
    else { $checkStmt->bind_param('ii', $id, $authUser['branch_id']); }
    $checkStmt->execute();
    if (!$checkStmt->get_result()->fetch_assoc()) {
        http_response_code(403); echo json_encode(['error' => 'Access denied']); exit;
    }

    $stmt = $db->prepare('UPDATE attendance SET employee_id=?, employee_name=?, date=?, status=?, leave_type=?, check_in=?, check_out=?, work_hours=? WHERE id=?');
    $stmt->bind_param('sssssssdi', $empId, $empName, $date, $status, $leave, $checkIn, $checkOut, $wh, $id);

    if ($stmt->execute()) { echo json_encode(['success' => true]); }
    else { http_response_code(500); echo json_encode(['error' => $db->error]); }
    $stmt->close(); $db->close(); exit;
}

// ── DELETE ────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }

    $branchCheck = $authUser['role'] === 'admin' ? 'WHERE id=?' : 'WHERE id=? AND branch_id=?';
    $checkStmt   = $db->prepare("SELECT id FROM attendance $branchCheck");
    if ($authUser['role'] === 'admin') { $checkStmt->bind_param('i', $id); }
    else { $checkStmt->bind_param('ii', $id, $authUser['branch_id']); }
    $checkStmt->execute();
    if (!$checkStmt->get_result()->fetch_assoc()) {
        http_response_code(403); echo json_encode(['error' => 'Access denied']); exit;
    }

    $stmt = $db->prepare('DELETE FROM attendance WHERE id = ?');
    $stmt->bind_param('i', $id);
    if ($stmt->execute()) { echo json_encode(['success' => true]); }
    else { http_response_code(500); echo json_encode(['error' => $db->error]); }
    $stmt->close(); $db->close(); exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);