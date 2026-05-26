<?php
// =============================================================
//  attendance.php
//  Called by Attendance.jsx for every operation:
//
//  GET    attendance.php                → fetch records + stats
//  GET    attendance.php?date=&status= → filtered records
//  GET    attendance.php?tab=today     → today's records
//  GET    attendance.php?tab=week      → this week's records
//  POST   attendance.php               → create record
//  PUT    attendance.php?id=N          → update record
//  DELETE attendance.php?id=N          → delete record
// =============================================================

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── Helper: read + validate JSON body ────────────────────────
function readBody(): array {
    $raw  = file_get_contents('php://input');
    $body = json_decode($raw, true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or missing JSON body']);
        exit;
    }
    return $body;
}

// ── Helper: sanitise time string (HH:MM) or return NULL ──────
function cleanTime(?string $t): ?string {
    if (!$t || !preg_match('/^\d{1,2}:\d{2}(:\d{2})?$/', $t)) return null;
    return $t;
}

// ─────────────────────────────────────────────────────────────
// GET — list records with optional filters + stats
// ─────────────────────────────────────────────────────────────
if ($method === 'GET') {

    $where  = [];
    $params = [];
    $types  = '';

    // Filter: date
    if (!empty($_GET['date'])) {
        $where[]  = 'a.date = ?';
        $params[] = $_GET['date'];
        $types   .= 's';
    }

    // Filter: status
    if (!empty($_GET['status'])) {
        $where[]  = 'a.status = ?';
        $params[] = $_GET['status'];
        $types   .= 's';
    }

    // Filter: search (name or emp_id)
    if (!empty($_GET['search'])) {
        $like     = '%' . $_GET['search'] . '%';
        $where[]  = '(a.employee_name LIKE ? OR a.employee_id LIKE ?)';
        $params[] = $like;
        $params[] = $like;
        $types   .= 'ss';
    }

    // Filter: tab
    if (!empty($_GET['tab'])) {
        switch ($_GET['tab']) {
            case 'today':
                $where[]  = 'a.date = CURDATE()';
                break;
            case 'week':
                $where[]  = 'a.date >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)';
                break;
        }
    }

    $whereSQL = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $sql  = "SELECT a.id, a.employee_id, a.employee_name, a.date, a.status,
                    a.leave_type, a.check_in, a.check_out, a.work_hours,
                    a.created_at, a.updated_at
             FROM attendance a
             $whereSQL
             ORDER BY a.date DESC, a.created_at DESC";

    $stmt = $db->prepare($sql);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result  = $stmt->get_result();

    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }
    $stmt->close();

    // ── Stats block ──────────────────────────────────────────
    // Today's counts
    $todaySQL    = "SELECT status, COUNT(*) AS cnt FROM attendance WHERE date = CURDATE() GROUP BY status";
    $todayResult = $db->query($todaySQL);
    $today       = [];
    while ($r = $todayResult->fetch_assoc()) {
        $today[$r['status']] = (int)$r['cnt'];
    }

    // All-time counts
    $allSQL    = "SELECT status, COUNT(*) AS cnt FROM attendance GROUP BY status";
    $allResult = $db->query($allSQL);
    $allTime   = [];
    while ($r = $allResult->fetch_assoc()) {
        $allTime[$r['status']] = (int)$r['cnt'];
    }

    // Total employees
    $totalEmp = (int)$db->query('SELECT COUNT(*) AS c FROM employees')->fetch_assoc()['c'];

    echo json_encode([
        'records' => $records,
        'stats'   => [
            'total_employees' => $totalEmp,
            'today'           => $today,
            'all_time'        => $allTime,
        ],
    ]);

    $db->close();
    exit;
}

// ─────────────────────────────────────────────────────────────
// POST — create a new attendance record
// ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = readBody();

    $empId   = trim($body['employee_id']   ?? '');
    $empName = trim($body['employee_name'] ?? '');
    $date    = trim($body['date']          ?? '');
    $status  = trim($body['status']        ?? 'Present');
    $leave   = trim($body['leave_type']    ?? '') ?: null;
    $checkIn = cleanTime($body['check_in']  ?? null);
    $checkOut= cleanTime($body['check_out'] ?? null);
    $wh      = is_numeric($body['work_hours'] ?? '') ? (float)$body['work_hours'] : null;

    if (!$empId || !$empName || !$date) {
        http_response_code(422);
        echo json_encode(['error' => 'employee_id, employee_name and date are required']);
        exit;
    }

    $stmt = $db->prepare(
        'INSERT INTO attendance
           (employee_id, employee_name, date, status, leave_type, check_in, check_out, work_hours)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param('sssssssd', $empId, $empName, $date, $status, $leave, $checkIn, $checkOut, $wh);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(['success' => true, 'id' => $db->insert_id]);
    } else {
        if ($db->errno === 1062) {
            http_response_code(409);
            echo json_encode(['error' => "Attendance for '$empId' on '$date' already exists"]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Insert failed: ' . $db->error]);
        }
    }
    $stmt->close();
    $db->close();
    exit;
}

// ─────────────────────────────────────────────────────────────
// PUT — update an existing attendance record
// ─────────────────────────────────────────────────────────────
if ($method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Record id required as query param ?id=N']);
        exit;
    }

    $body = readBody();

    $empId   = trim($body['employee_id']   ?? '');
    $empName = trim($body['employee_name'] ?? '');
    $date    = trim($body['date']          ?? '');
    $status  = trim($body['status']        ?? 'Present');
    $leave   = trim($body['leave_type']    ?? '') ?: null;
    $checkIn = cleanTime($body['check_in']  ?? null);
    $checkOut= cleanTime($body['check_out'] ?? null);
    $wh      = is_numeric($body['work_hours'] ?? '') ? (float)$body['work_hours'] : null;

    $stmt = $db->prepare(
        'UPDATE attendance
         SET employee_id=?, employee_name=?, date=?, status=?,
             leave_type=?, check_in=?, check_out=?, work_hours=?
         WHERE id=?'
    );
    $stmt->bind_param('sssssssdi', $empId, $empName, $date, $status, $leave, $checkIn, $checkOut, $wh, $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed: ' . $db->error]);
    }
    $stmt->close();
    $db->close();
    exit;
}

// ─────────────────────────────────────────────────────────────
// DELETE — remove a record by id
// ─────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Record id required as query param ?id=N']);
        exit;
    }

    $stmt = $db->prepare('DELETE FROM attendance WHERE id = ?');
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Delete failed: ' . $db->error]);
    }
    $stmt->close();
    $db->close();
    exit;
}

// Fallback for unsupported methods
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
$db->close();
