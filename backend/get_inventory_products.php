<?php
// =============================================================
// get_inventory_products.php  —  GET  ?search=
// Returns purchase_stock rows including min_stock (low alert)
// and branch_name.
// Branch users: own branch only.
// Admin: all branches (or the branch selected via X-Branch-ID).
// =============================================================
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

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

$effectiveBranch = getEffectiveBranchId($authUser);
$conn = getDB();

$search = isset($_GET['search']) ? trim($_GET['search']) : '';

$where  = [];
$params = [];
$types  = '';

if ($effectiveBranch !== null) {
    $where[]  = "ps.branch_id = ?";
    $params[] = $effectiveBranch;
    $types   .= 'i';
}
if ($search !== '') {
    $where[]  = "(ps.product_name LIKE ? OR ps.product_id LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $types   .= 'ss';
}

$whereSql = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

$sql = "SELECT ps.*, b.name AS branch_name, b.code AS branch_code
        FROM purchase_stock ps
        LEFT JOIN branches b ON b.id = ps.branch_id
        $whereSql
        ORDER BY ps.product_name ASC";

if (count($params) > 0) {
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query($sql);
}

$products = [];
while ($row = $result->fetch_assoc()) {
    // stock never displayed below zero
    if ((float)$row['current_stock'] < 0) $row['current_stock'] = '0.00';
    $min = (float)$row['min_stock'];
    $row['is_low_stock'] = ($min > 0 && (float)$row['current_stock'] <= $min) ? 1 : 0;
    $products[] = $row;
}

echo json_encode($products);
$conn->close();
?>