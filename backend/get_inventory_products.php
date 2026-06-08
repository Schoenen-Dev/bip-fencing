<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
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

$branchId = getEffectiveBranchId($authUser);
$conn = getDB();

// If no branch selected (admin viewing all branches), aggregate across all branches
if ($branchId === null) {
    $sql = "
        SELECT 
            pb.product_id,
            pb.product_name,
            SUM(pb.quantity) AS total_purchased,
            COALESCE(SUM(pb.quantity) - SUM(COALESCE(sd.deducted_qty, 0)), SUM(pb.quantity)) AS current_stock,
            AVG(pb.rate) AS rate
        FROM purchase_bills pb
        LEFT JOIN stock_deductions sd ON sd.product_id = pb.product_id
        GROUP BY pb.product_id, pb.product_name
        ORDER BY pb.product_name
    ";
    $result = $conn->query($sql);
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    echo json_encode($products);
    $conn->close();
    exit;
}

// Branch‑specific query
$sql = "
    SELECT 
        pb.product_id,
        pb.product_name,
        COALESCE(ps.total_purchased, SUM(pb.quantity)) AS total_purchased,
        COALESCE(ps.current_stock, SUM(pb.quantity)) AS current_stock,
        COALESCE(ps.rate, AVG(pb.rate)) AS rate
    FROM purchase_bills pb
    LEFT JOIN product_stock ps ON ps.product_id = pb.product_id AND ps.branch_id = ?
    WHERE pb.branch_id = ?
    GROUP BY pb.product_id, pb.product_name
    ORDER BY pb.product_name
";
$stmt = $conn->prepare($sql);
$stmt->bind_param('ii', $branchId, $branchId);
$stmt->execute();
$result = $stmt->get_result();
$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = $row;
}
echo json_encode($products);
$conn->close();
?>