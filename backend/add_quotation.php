<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON data']);
    exit;
}

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
    echo json_encode(['message' => 'No branch selected. Please select a branch from the topbar.']);
    exit;
}

// Collect all fields
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
    echo json_encode(['message' => 'Quote number, date, client name and at least one item are required']);
    exit;
}

$conn = getDB();

// Check duplicate quote number
$check = $conn->prepare("SELECT id FROM quotations WHERE quote_no = ? AND branch_id = ?");
$check->bind_param('si', $quote_no, $branchId);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['message' => 'Quote number already exists for this branch']);
    exit;
}
$check->close();

// Insert quotation header
$stmt = $conn->prepare("
    INSERT INTO quotations 
    (quote_no, quote_date, valid_until, po_no, dispatched_through, vehicle_no, other_ref,
     client_name, client_phone, client_email, client_gst, client_address,
     ship_name, ship_address, ship_gst, ship_state, ship_state_code,
     discount_percent, tax_percent, notes, declaration, branch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->bind_param('sssssssssssssssssddsis', 
    $quote_no, $quote_date, $valid_until, $po_no, $dispatched_through, $vehicle_no, $other_ref,
    $client_name, $client_phone, $client_email, $client_gst, $client_address,
    $ship_name, $ship_address, $ship_gst, $ship_state, $ship_state_code,
    $discount, $tax_percent, $notes, $declaration, $branchId
);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to insert quotation: ' . $stmt->error]);
    exit;
}
$quotation_id = $conn->insert_id;
$stmt->close();

// Insert items with new fields
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
        $itemStmt->bind_param('issssddd', $quotation_id, $desc, $hsn, $due, $unit, $qty, $rate, $amt);
        $itemStmt->execute();
    }
}
$itemStmt->close();

echo json_encode(['message' => 'Quotation saved successfully', 'id' => $quotation_id]);
$conn->close();
?>