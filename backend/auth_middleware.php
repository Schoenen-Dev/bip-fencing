<?php
// =============================================================
//  auth_middleware.php
//  Include at top of every protected backend file.
//  Sets: $authUser = [ id, username, role, branch_id, ... ]
//  Also sets $authUser['view_branch_id'] for admin impersonation
// =============================================================

require_once __DIR__ . '/cors.php';

// ── Read Bearer token from Authorization header ───────────────
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader && function_exists('apache_request_headers')) {
    $headers    = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? '';
}
$token = '';
if (preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) {
    $token = trim($m[1]);
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorised — no token provided']);
    exit;
}

// ── Validate token against sessions table ────────────────────
require_once __DIR__ . '/db_pdo.php'; // PDO connection → $pdo

$stmt = $pdo->prepare(
    "SELECT u.id, u.username, u.full_name, u.role, u.branch_id, u.is_active,
            b.name AS branch_name, b.code AS branch_code,
            s.created_at AS session_created
     FROM sessions s
     JOIN users    u ON u.id = s.user_id
     LEFT JOIN branches b ON b.id = u.branch_id
     WHERE s.id = ?
     LIMIT 1"
);
$stmt->execute([$token]);
$authUser = $stmt->fetch();

if (!$authUser || !$authUser['is_active']) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorised — invalid or expired token']);
    exit;
}

// ── Admin branch impersonation ─────────────────────────────────
// If admin, read X-Branch-ID header to decide which branch to view
$authUser['view_branch_id'] = null;
if ($authUser['role'] === 'admin') {
    $headers = getallheaders();
    $viewBranch = $headers['X-Branch-ID'] ?? '';
    if ($viewBranch && is_numeric($viewBranch)) {
        $authUser['view_branch_id'] = (int)$viewBranch;
    }
} else {
    // Non-admin always sees only their own branch
    $authUser['view_branch_id'] = $authUser['branch_id'];
}

// ── Branch filter helpers (now use view_branch_id) ────────────
// Returns [WHERE clause string, params array] for use in queries.
function branchFilter(array $user): array {
    if ($user['role'] === 'admin' && $user['view_branch_id'] === null) {
        return ['', []]; // admin with no branch selected → all branches
    }
    return ['WHERE branch_id = ?', [(int)$user['view_branch_id']]];
}

// Same but for queries that already have a WHERE clause
function branchAnd(array $user): array {
    if ($user['role'] === 'admin' && $user['view_branch_id'] === null) {
        return ['', []];
    }
    return ['AND branch_id = ?', [(int)$user['view_branch_id']]];
}
?>