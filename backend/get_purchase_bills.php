<?php
// =============================================================
// get_purchase_bills.php  —  GET
// Returns bills with items[] and payments[].
// Branch users: own branch only. Admin: all branches (or the
// branch selected via X-Branch-ID). Each row includes
// branch_name so the admin can see which branch a bill belongs to.
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

$company  = isset($_GET['company']) ? trim($_GET['company']) : '';
$product  = isset($_GET['product']) ? trim($_GET['product']) : '';
$invoice  = isset($_GET['invoice']) ? trim($_GET['invoice']) : '';
$dateFrom = isset($_GET['date_from']) ? trim($_GET['date_from']) : '';
$dateTo   = isset($_GET['date_to']) ? trim($_GET['date_to']) : '';

$where  = [];
$params = [];
$types  = '';

if ($effectiveBranch !== null) {
    $where[]  = "pb.branch_id = ?";
    $params[] = $effectiveBranch;
    $types   .= 'i';
}
if ($company !== '') {
    $where[]  = "pb.company_name LIKE ?";
    $params[] = "%$company%";
    $types   .= 's';
}
if ($invoice !== '') {
    $where[]  = "pb.invoice_no LIKE ?";
    $params[] = "%$invoice%";
    $types   .= 's';
}
if ($dateFrom !== '') {
    $where[]  = "pb.bill_date >= ?";
    $params[] = $dateFrom;
    $types   .= 's';
}
if ($dateTo !== '') {
    $where[]  = "pb.bill_date <= ?";
    $params[] = $dateTo;
    $types   .= 's';
}
if ($product !== '') {
    $where[]  = "EXISTS (SELECT 1 FROM purchase_bill_items pbi WHERE pbi.purchase_bill_id = pb.id AND (pbi.product_name LIKE ? OR pbi.product_id LIKE ?))";
    $params[] = "%$product%";
    $params[] = "%$product%";
    $types   .= 'ss';
}

$whereSql = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

$sql = "SELECT pb.*, b.name AS branch_name, b.code AS branch_code
        FROM purchase_bills pb
        LEFT JOIN branches b ON b.id = pb.branch_id
        $whereSql
        ORDER BY pb.bill_date DESC, pb.id DESC";

if (count($params) > 0) {
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query($sql);
}

$bills = [];
$billIds = [];
while ($row = $result->fetch_assoc()) {
    $row['items']    = [];
    $row['payments'] = [];
    // convenience field for the frontend
    $row['balance_amount'] = (float)$row['closing_balance'];
    $bills[$row['id']] = $row;
    $billIds[] = (int)$row['id'];
}

if (count($billIds) > 0) {
    $placeholders = implode(',', array_fill(0, count($billIds), '?'));
    $itemTypes = str_repeat('i', count($billIds));

    // Items
    $itemSql = "SELECT * FROM purchase_bill_items WHERE purchase_bill_id IN ($placeholders) ORDER BY id ASC";
    $itemStmt = $conn->prepare($itemSql);
    $itemStmt->bind_param($itemTypes, ...$billIds);
    $itemStmt->execute();
    $itemResult = $itemStmt->get_result();
    while ($itemRow = $itemResult->fetch_assoc()) {
        $bIdKey = (int)$itemRow['purchase_bill_id'];
        if (isset($bills[$bIdKey])) {
            $bills[$bIdKey]['items'][] = $itemRow;
        }
    }
    $itemStmt->close();

    // Payments
    $paySql = "SELECT * FROM purchase_bill_payments WHERE purchase_bill_id IN ($placeholders) ORDER BY payment_date ASC, id ASC";
    $payStmt = $conn->prepare($paySql);
    $payStmt->bind_param($itemTypes, ...$billIds);
    $payStmt->execute();
    $payResult = $payStmt->get_result();
    while ($payRow = $payResult->fetch_assoc()) {
        $bIdKey = (int)$payRow['purchase_bill_id'];
        if (isset($bills[$bIdKey])) {
            $bills[$bIdKey]['payments'][] = $payRow;
        }
    }
    $payStmt->close();
}

echo json_encode(array_values($bills));
$conn->close();
?>