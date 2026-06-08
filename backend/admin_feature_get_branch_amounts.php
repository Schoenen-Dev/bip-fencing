<?php
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

// Admin only
if ($authUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['message' => 'Admin access required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

// Helper to get effective branch ID (same as used in other endpoints)
function getEffectiveBranchId($user): ?int {
    if ($user['role'] === 'admin' && isset($user['view_branch_id']) && $user['view_branch_id'] !== null) {
        return (int)$user['view_branch_id'];
    }
    if ($user['role'] !== 'admin' && isset($user['branch_id']) && $user['branch_id'] !== null) {
        return (int)$user['branch_id'];
    }
    return null;
}

$effectiveBranch = getEffectiveBranchId($authUser);

$sql = "SELECT ba.id, b.name as branch_name, ba.amount, ba.payment_date, ba.note 
        FROM branch_amounts ba
        JOIN branches b ON ba.branch_id = b.id";
$params = [];
$types = '';

if ($effectiveBranch !== null) {
    $sql .= " WHERE ba.branch_id = ?";
    $params[] = $effectiveBranch;
    $types = 'i';
}

$sql .= " ORDER BY ba.payment_date DESC, ba.id DESC";

$stmt = $conn->prepare($sql);
if ($params) $stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$records = [];
while ($row = $result->fetch_assoc()) {
    $records[] = $row;
}

echo json_encode($records);
$conn->close();
?>