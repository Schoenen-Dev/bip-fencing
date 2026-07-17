<?php
// =============================================================
// update_purchase_bill.php  —  POST (JSON)  —  ADMIN ONLY
// Edits an existing purchase bill. Old item quantities are
// reversed from purchase_stock, then the new items are applied,
// so inventory stays correct after an edit.
// =============================================================
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($authUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['message' => 'Only admin can edit purchase bills']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON']);
    exit;
}

$billId          = (int)($data['bill_id'] ?? 0);
$company_name    = trim($data['company_name'] ?? '');
$invoice_no      = trim($data['invoice_no'] ?? '');
$bill_date       = trim($data['bill_date'] ?? '');
$notes           = trim($data['notes'] ?? '');
$items           = $data['items'] ?? [];
$gst_enabled     = !empty($data['gst_enabled']) ? 1 : 0;
$gst_rate        = $gst_enabled ? (float)($data['gst_rate'] ?? 18) : 0.0;
$opening_balance = (float)($data['opening_balance'] ?? 0);
$paid_amount     = (float)($data['paid_amount'] ?? 0);

if ($billId <= 0 || empty($company_name) || empty($invoice_no) || empty($bill_date) || !is_array($items) || count($items) === 0) {
    http_response_code(400);
    echo json_encode(['message' => 'Bill ID, company name, invoice no, date and at least one item are required']);
    exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $bill_date)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid date format. Use YYYY-MM-DD']);
    exit;
}

$subtotal = 0.0;
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
    $subtotal += $amount;
    $cleanItems[] = [
        'product_id' => $pid, 'product_name' => $pname,
        'quantity' => $qty, 'rate' => $rate, 'amount' => $amount,
    ];
}

$gst_amount      = $gst_enabled ? round($subtotal * $gst_rate / 100, 2) : 0.0;
$total_amount    = round($subtotal + $gst_amount, 2);
$closing_balance = round($opening_balance + $total_amount - $paid_amount, 2);

$conn = getDB();
$conn->begin_transaction();

try {
    // Lock the bill row and get its branch
    $stmt = $conn->prepare("SELECT id, branch_id FROM purchase_bills WHERE id = ? FOR UPDATE");
    $stmt->bind_param('i', $billId);
    $stmt->execute();
    $bill = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$bill) {
        throw new Exception('Purchase bill not found');
    }
    $branchId = (int)$bill['branch_id'];

    // 1. Reverse old item quantities from stock
    $oldStmt = $conn->prepare("SELECT product_id, quantity FROM purchase_bill_items WHERE purchase_bill_id = ?");
    $oldStmt->bind_param('i', $billId);
    $oldStmt->execute();
    $oldItems = $oldStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $oldStmt->close();

    $revStmt = $conn->prepare(
        "UPDATE purchase_stock
            SET total_purchased = GREATEST(total_purchased - ?, 0),
                current_stock   = current_stock - ?
          WHERE product_id = ? AND branch_id = ?"
    );
    foreach ($oldItems as $old) {
        $q = (float)$old['quantity'];
        $revStmt->bind_param('ddsi', $q, $q, $old['product_id'], $branchId);
        $revStmt->execute();
    }
    $revStmt->close();

    // 2. Delete old items
    $delStmt = $conn->prepare("DELETE FROM purchase_bill_items WHERE purchase_bill_id = ?");
    $delStmt->bind_param('i', $billId);
    $delStmt->execute();
    $delStmt->close();

    // 3. Update bill header
    $upStmt = $conn->prepare(
        "UPDATE purchase_bills
            SET company_name = ?, invoice_no = ?, bill_date = ?, subtotal = ?, gst_enabled = ?,
                gst_rate = ?, gst_amount = ?, total_amount = ?, opening_balance = ?,
                paid_amount = ?, closing_balance = ?, notes = ?
          WHERE id = ?"
    );
    $upStmt->bind_param(
        'sssdiddddddsi',
        $company_name, $invoice_no, $bill_date, $subtotal, $gst_enabled,
        $gst_rate, $gst_amount, $total_amount, $opening_balance,
        $paid_amount, $closing_balance, $notes, $billId
    );
    $upStmt->execute();
    $upStmt->close();

    // 4. Insert new items + apply stock
    $itemStmt = $conn->prepare(
        "INSERT INTO purchase_bill_items
            (purchase_bill_id, product_id, product_name, quantity, rate, amount, branch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stockSelectStmt = $conn->prepare(
        "SELECT current_stock FROM purchase_stock WHERE product_id = ? AND branch_id = ?"
    );
    $stockUpdateStmt = $conn->prepare(
        "UPDATE purchase_stock
            SET total_purchased = total_purchased + ?,
                current_stock   = current_stock + ?,
                rate            = ?,
                product_name    = ?
          WHERE product_id = ? AND branch_id = ?"
    );
    $stockInsertStmt = $conn->prepare(
        "INSERT INTO purchase_stock
            (product_id, product_name, total_purchased, current_stock, rate, branch_id)
         VALUES (?, ?, ?, ?, ?, ?)"
    );

    foreach ($cleanItems as $item) {
        $pid = $item['product_id']; $pname = $item['product_name'];
        $qty = $item['quantity'];   $rate  = $item['rate'];
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
    echo json_encode(['message' => 'Purchase bill updated successfully', 'bill_id' => $billId]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
?>