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
if ($branchId === null) {
    http_response_code(400);
    echo json_encode(['message' => 'Please select a specific branch to add purchase bills.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON']);
    exit;
}

$company_name = trim($data['company_name'] ?? '');
$invoice_no   = trim($data['invoice_no'] ?? '');
$bill_date    = trim($data['bill_date'] ?? '');
$notes        = trim($data['notes'] ?? '');
$items        = $data['items'] ?? [];

if (empty($company_name) || empty($invoice_no) || empty($bill_date) || !is_array($items) || count($items) === 0) {
    http_response_code(400);
    echo json_encode(['message' => 'Company name, invoice no, date and at least one product item are required']);
    exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $bill_date)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid date format. Use YYYY-MM-DD']);
    exit;
}

$total_amount = 0.0;
$cleanItems = [];

foreach ($items as $idx => $item) {
    $pid   = trim($item['product_id'] ?? '');
    $pname = trim($item['product_name'] ?? '');
    $qty   = (float)($item['quantity'] ?? 0);
    $rate  = (float)($item['rate'] ?? 0);

    if ($pid === '' || $pname === '' || $qty <= 0 || $rate < 0) {
        http_response_code(400);
        echo json_encode(['message' => "Item #" . ($idx + 1) . ": product ID, name and valid quantity/rate are required"]);
        exit;
    }

    $amount = $qty * $rate;
    $total_amount += $amount;

    $cleanItems[] = [
        'product_id'   => $pid,
        'product_name' => $pname,
        'quantity'     => $qty,
        'rate'         => $rate,
        'amount'       => $amount,
    ];
}

$conn = getDB();
$conn->begin_transaction();

try {
    $stmt = $conn->prepare(
        "INSERT INTO purchase_bills (company_name, invoice_no, bill_date, total_amount, notes, branch_id)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('sssdsi', $company_name, $invoice_no, $bill_date, $total_amount, $notes, $branchId);
    $stmt->execute();
    $billId = (int)$conn->insert_id;
    $stmt->close();

    $itemStmt = $conn->prepare(
        "INSERT INTO purchase_bill_items
            (purchase_bill_id, product_id, product_name, quantity, rate, amount, branch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    $stockSelectStmt = $conn->prepare(
        "SELECT current_stock, total_purchased FROM purchase_stock WHERE product_id = ? AND branch_id = ?"
    );

    $stockUpdateStmt = $conn->prepare(
        "UPDATE purchase_stock
            SET total_purchased = total_purchased + ?,
                current_stock    = current_stock + ?,
                rate             = ?,
                product_name     = ?
          WHERE product_id = ? AND branch_id = ?"
    );

    $stockInsertStmt = $conn->prepare(
        "INSERT INTO purchase_stock
            (product_id, product_name, total_purchased, current_stock, rate, branch_id)
         VALUES (?, ?, ?, ?, ?, ?)"
    );

    foreach ($cleanItems as $item) {
        $pid    = $item['product_id'];
        $pname  = $item['product_name'];
        $qty    = $item['quantity'];
        $rate   = $item['rate'];
        $amount = $item['amount'];

        $itemStmt->bind_param('issdddi', $billId, $pid, $pname, $qty, $rate, $amount, $branchId);
        $itemStmt->execute();

        $stockSelectStmt->bind_param('si', $pid, $branchId);
        $stockSelectStmt->execute();
        $stockRow = $stockSelectStmt->get_result()->fetch_assoc();

        if ($stockRow) {
            $stockUpdateStmt->bind_param('dddssi', $qty, $qty, $rate, $pname, $pid, $branchId);
            $stockUpdateStmt->execute();
        } else {
            $stockInsertStmt->bind_param('ssdddi', $pid, $pname, $qty, $qty, $rate, $branchId);
            $stockInsertStmt->execute();
        }
    }

    $itemStmt->close();
    $stockSelectStmt->close();
    $stockUpdateStmt->close();
    $stockInsertStmt->close();

    $conn->commit();
    echo json_encode(['message' => 'Purchase bill saved successfully', 'bill_id' => $billId]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
?>