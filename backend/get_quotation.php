<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

$id = (int)($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Quotation ID required']);
    exit;
}

$conn = getDB();

$stmt = $conn->prepare("SELECT * FROM quotations WHERE id = ?");
$stmt->bind_param('i', $id);
$stmt->execute();
$quotation = $stmt->get_result()->fetch_assoc();
if (!$quotation) {
    http_response_code(404);
    echo json_encode(['error' => 'Quotation not found']);
    exit;
}
$stmt->close();

$itemStmt = $conn->prepare("SELECT description, hsn, due_on, unit, quantity, rate, amount FROM quotation_items WHERE quotation_id = ?");
$itemStmt->bind_param('i', $id);
$itemStmt->execute();
$items = $itemStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$itemStmt->close();

$quotation['items'] = $items;
$subtotal = 0;
foreach ($items as $it) {
    $subtotal += $it['amount'];
}
$discountAmt = $subtotal * $quotation['discount_percent'] / 100;
$taxable = $subtotal - $discountAmt;
$taxAmt = $taxable * $quotation['tax_percent'] / 100;
$grandTotal = $taxable + $taxAmt;
$quotation['subtotal'] = $subtotal;
$quotation['discount_amount'] = $discountAmt;
$quotation['tax_amount'] = $taxAmt;
$quotation['grand_total'] = $grandTotal;

echo json_encode($quotation);
$conn->close();
?>