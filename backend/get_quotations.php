<?php
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

$branchId = getEffectiveBranchId($authUser);
$conn = getDB();

if ($branchId !== null) {
    $stmt = $conn->prepare("
        SELECT q.*, 
            (SELECT COUNT(*) FROM quotation_items WHERE quotation_id = q.id) as items_count,
            (SELECT SUM(quantity * rate) FROM quotation_items WHERE quotation_id = q.id) as subtotal
        FROM quotations q
        WHERE q.branch_id = ?
        ORDER BY q.id DESC
    ");
    $stmt->bind_param('i', $branchId);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query("
        SELECT q.*, 
            (SELECT COUNT(*) FROM quotation_items WHERE quotation_id = q.id) as items_count,
            (SELECT SUM(quantity * rate) FROM quotation_items WHERE quotation_id = q.id) as subtotal
        FROM quotations q
        ORDER BY q.id DESC
    ");
}

$rows = [];
while ($row = $result->fetch_assoc()) {
    $subtotal = (float)$row['subtotal'];
    $discountAmt = $subtotal * $row['discount_percent'] / 100;
    $taxable = $subtotal - $discountAmt;
    $taxAmt = $taxable * $row['tax_percent'] / 100;
    $grandTotal = $taxable + $taxAmt;
    $row['discount_amount'] = $discountAmt;
    $row['tax_amount'] = $taxAmt;
    $row['grand_total'] = $grandTotal;
    $rows[] = $row;
}
echo json_encode($rows);
$conn->close();
?>