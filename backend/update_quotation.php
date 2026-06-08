<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid data or missing ID']);
    exit;
}

$id = (int)$data['id'];

// Permission check (branch)
$branchCheck = $authUser['role'] === 'admin' && isset($authUser['view_branch_id']) && $authUser['view_branch_id'] !== null
    ? $authUser['view_branch_id']
    : ($authUser['role'] !== 'admin' ? $authUser['branch_id'] : null);
$conn = getDB();
if ($branchCheck !== null) {
    $chk = $conn->prepare("SELECT id FROM quotations WHERE id = ? AND branch_id = ?");
    $chk->bind_param('ii', $id, $branchCheck);
    $chk->execute();
    if (!$chk->get_result()->fetch_assoc()) {
        http_response_code(403);
        echo json_encode(['message' => 'Access denied']);
        exit;
    }
    $chk->close();
}

$quote_no          = trim($data['quoteNo'] ?? '');
$quote_date        = trim($data['quoteDate'] ?? '');
$valid_until       = trim($data['validUntil'] ?? '');
$po_no             = trim($data['poNo'] ?? '');
$dispatched_through= trim($data['dispatchedThrough'] ?? '');
$vehicle_no        = trim($data['vehicleNo'] ?? '');
$other_ref         = trim($data['otherRef'] ?? '');
$client_name       = trim($data['clientName'] ?? '');
$client_phone      = trim($data['clientPhone'] ?? '');
$client_email      = trim($data['clientEmail'] ?? '');
$client_gst        = trim($data['clientGst'] ?? '');
$client_address    = trim($data['clientAddress'] ?? '');
$ship_name         = trim($data['shipName'] ?? '');
$ship_address      = trim($data['shipAddress'] ?? '');
$ship_gst          = trim($data['shipGst'] ?? '');
$ship_state        = trim($data['shipState'] ?? '');
$ship_state_code   = trim($data['shipStateCode'] ?? '');
$discount          = (float)($data['discount'] ?? 0);
$tax_percent       = (float)($data['taxPercent'] ?? 18);
$notes             = trim($data['notes'] ?? '');
$declaration       = trim($data['declaration'] ?? '');
$items             = $data['items'] ?? [];

if (empty($quote_no) || empty($quote_date) || empty($client_name) || empty($items)) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

// Update header
$stmt = $conn->prepare("
    UPDATE quotations SET
        quote_no=?, quote_date=?, valid_until=?, po_no=?, dispatched_through=?, vehicle_no=?, other_ref=?,
        client_name=?, client_phone=?, client_email=?, client_gst=?, client_address=?,
        ship_name=?, ship_address=?, ship_gst=?, ship_state=?, ship_state_code=?,
        discount_percent=?, tax_percent=?, notes=?, declaration=?
    WHERE id=?
");
$stmt->bind_param('sssssssssssssssssddsisi', 
    $quote_no, $quote_date, $valid_until, $po_no, $dispatched_through, $vehicle_no, $other_ref,
    $client_name, $client_phone, $client_email, $client_gst, $client_address,
    $ship_name, $ship_address, $ship_gst, $ship_state, $ship_state_code,
    $discount, $tax_percent, $notes, $declaration, $id
);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['message' => 'Update failed: ' . $stmt->error]);
    exit;
}
$stmt->close();

// Delete old items and insert new ones
$conn->query("DELETE FROM quotation_items WHERE quotation_id = $id");
$itemStmt = $conn->prepare("
    INSERT INTO quotation_items 
    (quotation_id, description, hsn, due_on, unit, quantity, rate, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");
foreach ($items as $item) {
    $desc = trim($item['description'] ?? '');
    $hsn  = trim($item['hsn'] ?? '');
    $due  = trim($item['dueOn'] ?? null) ?: null;
    $unit = trim($item['unit'] ?? 'Nos');
    $qty  = (float)($item['qty'] ?? 0);
    $rate = (float)($item['rate'] ?? 0);
    $amt  = $qty * $rate;
    if ($desc && $qty > 0) {
        $itemStmt->bind_param('issssddd', $id, $desc, $hsn, $due, $unit, $qty, $rate, $amt);
        $itemStmt->execute();
    }
}
$itemStmt->close();

echo json_encode(['message' => 'Quotation updated successfully']);
$conn->close();
?>