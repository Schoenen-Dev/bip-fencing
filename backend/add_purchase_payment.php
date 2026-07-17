<?php
// =============================================================
// add_purchase_payment.php  —  POST (JSON)
// { bill_id, amount, payment_date (YYYY-MM-DD, optional), note }
// Records a payment against a purchase bill and updates the
// bill's paid_amount + closing_balance.
// Branch users can only pay bills of their own branch;
// admin can pay any bill.
// =============================================================
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON']);
    exit;
}

$billId       = (int)($data['bill_id'] ?? 0);
$amount       = (float)($data['amount'] ?? 0);
$payment_date = trim($data['payment_date'] ?? date('Y-m-d'));
$note         = trim($data['note'] ?? '');

if ($billId <= 0 || $amount <= 0) {
    http_response_code(400);
    echo json_encode(['message' => 'Valid bill_id and payment amount required']);
    exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $payment_date)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid payment date. Use YYYY-MM-DD']);
    exit;
}

$conn = getDB();
$conn->begin_transaction();

try {
    $stmt = $conn->prepare(
        "SELECT id, branch_id, total_amount, opening_balance, paid_amount
         FROM purchase_bills WHERE id = ? FOR UPDATE"
    );
    $stmt->bind_param('i', $billId);
    $stmt->execute();
    $bill = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$bill) {
        throw new Exception('Purchase bill not found');
    }

    $billBranch = (int)$bill['branch_id'];

    // Branch users may only record payments for their own branch's bills
    if ($authUser['role'] !== 'admin' && (int)$authUser['branch_id'] !== $billBranch) {
        http_response_code(403);
        echo json_encode(['message' => 'You can only record payments for your own branch']);
        $conn->rollback();
        $conn->close();
        exit;
    }

    $newPaid    = round((float)$bill['paid_amount'] + $amount, 2);
    $newClosing = round((float)$bill['opening_balance'] + (float)$bill['total_amount'] - $newPaid, 2);

    $payStmt = $conn->prepare(
        "INSERT INTO purchase_bill_payments (purchase_bill_id, amount, payment_date, note, branch_id)
         VALUES (?, ?, ?, ?, ?)"
    );
    $payStmt->bind_param('idssi', $billId, $amount, $payment_date, $note, $billBranch);
    $payStmt->execute();
    $payStmt->close();

    $upStmt = $conn->prepare(
        "UPDATE purchase_bills SET paid_amount = ?, closing_balance = ? WHERE id = ?"
    );
    $upStmt->bind_param('ddi', $newPaid, $newClosing, $billId);
    $upStmt->execute();
    $upStmt->close();

    $conn->commit();
    echo json_encode([
        'message'         => 'Payment recorded successfully',
        'paid_amount'     => $newPaid,
        'closing_balance' => $newClosing,
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
?>

