<?php
// ============================================================
//  save_invoice.php  –  Insert or Update invoice + line items
//  Also auto-creates or links a client record by phone number
// ============================================================

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';
if (isset($_GET['next_no'])) {
    $res = $conn->query("SELECT invoice_no FROM invoices ORDER BY id DESC LIMIT 1");
    $row = $res->fetch_assoc();
    if ($row && preg_match('/(\d+)$/', $row['invoice_no'], $m)) {
        $next = str_pad((int)$m[1] + 1, 3, '0', STR_PAD_LEFT);
    } else {
        $next = '001';
    }
    echo json_encode(['next_no' => "BFCWS-{$next}"]);
    exit;
}



if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

if (empty($data['invoice_no']) || empty($data['invoice_date']) || empty($data['buyer_name'])) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'invoice_no, invoice_date and buyer_name are required']);
    exit;
}
if (empty($data['items']) || !is_array($data['items'])) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'At least one item is required']);
    exit;
}

$branch_id = $authUser['branch_id'] ?? null;

// ── Helpers ───────────────────────────────────────────────────
$s = fn($k) => isset($data[$k]) && $data[$k] !== '' ? (string)$data[$k] : null;
$f = fn($k) => isset($data[$k]) ? floatval($data[$k]) : 0.0;
$d = fn($k)  => !empty($data[$k]) ? $data[$k] : null;

// ── Collect all values ────────────────────────────────────────
$copy_type            = $s('copy_type');
$payment_mode         = $s('payment_mode');
$gst_rate             = $f('gst_rate') ?: 18;
$invoice_no           = $s('invoice_no');
$invoice_date         = $data['invoice_date'];
$reference_no         = $s('reference_no');
$buyers_order_no      = $s('buyers_order_no');
$dated                = $d('dated');
$dispatch_doc_no      = $s('dispatch_doc_no');
$delivery_note_date   = $d('delivery_note_date');
$dispatched_through   = $s('dispatched_through');
$destination          = $s('destination');
$bill_of_lading       = $s('bill_of_lading');
$motor_vehicle_no     = $s('motor_vehicle_no');
$eway_required        = $s('eway_required');
$eway_number          = $s('eway_number');
$consignee_name       = $s('consignee_name');
$consignee_address    = $s('consignee_address');
$consignee_state      = $s('consignee_state');
$consignee_state_code = $s('consignee_state_code');
$buyer_name           = $s('buyer_name');
$buyer_address        = $s('buyer_address');
$buyer_phone          = $s('buyer_phone');
$buyer_gst            = $s('buyer_gst');
$buyer_state          = $s('buyer_state');
$buyer_state_code     = $s('buyer_state_code');
$subtotal             = $f('subtotal');
$cgst_rate            = $f('cgst_rate');
$cgst_amount          = $f('cgst_amount');
$sgst_rate            = $f('sgst_rate');
$sgst_amount          = $f('sgst_amount');
$total_tax            = $f('total_tax');
$round_off            = $f('round_off');
$net_amount           = $f('net_amount');
$open_balance         = $f('open_balance');
$closing_balance      = $f('closing_balance');
$bank_holder_name     = $s('bank_holder_name');
$bank_name            = $s('bank_name');
$bank_account_no      = $s('bank_account_no');
$bank_ifsc            = $s('bank_ifsc');
$bank_branch          = $s('bank_branch');

// ── Step 1: Auto-create or find client by phone ───────────────
// ── Step 1: Auto-create or find client by phone ───────────────
if ($buyer_phone) {
    $buyer_phone = preg_replace('/\D/', '', $buyer_phone);
}

$client_id = null;
if ($buyer_phone) {
    // Check if client with this phone exists in this branch
    if ($branch_id === null) {
        $cChk = $conn->prepare("SELECT id FROM clients WHERE phone = ? AND branch_id IS NULL");
        $cChk->bind_param('s', $buyer_phone);
    } else {
        $cChk = $conn->prepare("SELECT id FROM clients WHERE phone = ? AND branch_id = ?");
        $cChk->bind_param('si', $buyer_phone, $branch_id);
    }
    $cChk->execute();
    $existingClient = $cChk->get_result()->fetch_assoc();
    $cChk->close();

    if ($existingClient) {
        // Client exists — update name/address in case they changed
        $client_id = $existingClient['id'];
        $cUpd = $conn->prepare("UPDATE clients SET name=?, address=?, gst=? WHERE id=?");
        $cUpd->bind_param('sssi', $buyer_name, $buyer_address, $buyer_gst, $client_id);
        $cUpd->execute();
        $cUpd->close();
    } else {
        // New client — insert
        $cIns = $conn->prepare("INSERT INTO clients (name, phone, address, gst, branch_id) VALUES (?,?,?,?,?)");
        $cIns->bind_param('ssssi', $buyer_name, $buyer_phone, $buyer_address, $buyer_gst, $branch_id);
        $cIns->execute();
        $client_id = $conn->insert_id;
        $cIns->close();
    }
}

// ── Step 2: Check if invoice_no already exists ────────────────
$chk = $conn->prepare("SELECT id FROM invoices WHERE invoice_no = ?");
$chk->bind_param('s', $invoice_no);
$chk->execute();
$existing = $chk->get_result()->fetch_assoc();
$chk->close();

if ($existing) {
    // ── UPDATE existing invoice ───────────────────────────────
    $invoice_id = $existing['id'];

    $stmt = $conn->prepare("
        UPDATE invoices SET
            copy_type=?, payment_mode=?, gst_rate=?,
            invoice_date=?, reference_no=?, buyers_order_no=?, dated=?,
            dispatch_doc_no=?, delivery_note_date=?, dispatched_through=?, destination=?,
            bill_of_lading=?, motor_vehicle_no=?, eway_required=?, eway_number=?,
            consignee_name=?, consignee_address=?, consignee_state=?, consignee_state_code=?,
            buyer_name=?, buyer_address=?, buyer_phone=?, buyer_gst=?, buyer_state=?, buyer_state_code=?,
            subtotal=?, cgst_rate=?, cgst_amount=?, sgst_rate=?, sgst_amount=?,
            total_tax=?, round_off=?, net_amount=?,
            open_balance=?, closing_balance=?,
            bank_holder_name=?, bank_name=?, bank_account_no=?, bank_ifsc=?, bank_branch=?,
            client_id=?
        WHERE id=?
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param(
        'ssdsssssssssssssssssssssssddddddddddsssssi',
        $copy_type, $payment_mode, $gst_rate,
        $invoice_date, $reference_no, $buyers_order_no, $dated,
        $dispatch_doc_no, $delivery_note_date, $dispatched_through, $destination,
        $bill_of_lading, $motor_vehicle_no, $eway_required, $eway_number,
        $consignee_name, $consignee_address, $consignee_state, $consignee_state_code,
        $buyer_name, $buyer_address, $buyer_phone, $buyer_gst, $buyer_state, $buyer_state_code,
        $subtotal, $cgst_rate, $cgst_amount, $sgst_rate, $sgst_amount,
        $total_tax, $round_off, $net_amount,
        $open_balance, $closing_balance,
        $bank_holder_name, $bank_name, $bank_account_no, $bank_ifsc, $bank_branch,
        $client_id, $invoice_id
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Update failed: ' . $stmt->error]);
        exit;
    }
    $stmt->close();

    $conn->query("DELETE FROM invoice_items WHERE invoice_id = $invoice_id");
    $action = 'updated';

} else {
    // ── INSERT new invoice ────────────────────────────────────
    $stmt = $conn->prepare("
        INSERT INTO invoices (
            copy_type, payment_mode, gst_rate,
            invoice_no, invoice_date, reference_no, buyers_order_no, dated,
            dispatch_doc_no, delivery_note_date, dispatched_through, destination,
            bill_of_lading, motor_vehicle_no, eway_required, eway_number,
            consignee_name, consignee_address, consignee_state, consignee_state_code,
            buyer_name, buyer_address, buyer_phone, buyer_gst, buyer_state, buyer_state_code,
            subtotal, cgst_rate, cgst_amount, sgst_rate, sgst_amount,
            total_tax, round_off, net_amount,
            open_balance, closing_balance,
            bank_holder_name, bank_name, bank_account_no, bank_ifsc, bank_branch,
            branch_id, client_id
        ) VALUES (
            ?,?,?,
            ?,?,?,?,?,
            ?,?,?,?,
            ?,?,?,?,
            ?,?,?,?,
            ?,?,?,?,?,?,
            ?,?,?,?,?,
            ?,?,?,
            ?,?,
            ?,?,?,?,?,
            ?,?
        )
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param(
        'ssdsssssssssssssssssssssssddddddddddsssssii',
        $copy_type, $payment_mode, $gst_rate,
        $invoice_no, $invoice_date, $reference_no, $buyers_order_no, $dated,
        $dispatch_doc_no, $delivery_note_date, $dispatched_through, $destination,
        $bill_of_lading, $motor_vehicle_no, $eway_required, $eway_number,
        $consignee_name, $consignee_address, $consignee_state, $consignee_state_code,
        $buyer_name, $buyer_address, $buyer_phone, $buyer_gst, $buyer_state, $buyer_state_code,
        $subtotal, $cgst_rate, $cgst_amount, $sgst_rate, $sgst_amount,
        $total_tax, $round_off, $net_amount,
        $open_balance, $closing_balance,
        $bank_holder_name, $bank_name, $bank_account_no, $bank_ifsc, $bank_branch,
        $branch_id, $client_id
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $stmt->error]);
        exit;
    }

    $invoice_id = $conn->insert_id;
    $stmt->close();
    $action = 'created';
}

// ── Step 3: Insert line items ─────────────────────────────────
$iStmt = $conn->prepare("
    INSERT INTO invoice_items (invoice_id, description, hsn, qty, per, rate_incl, rate_excl, taxable_amt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

foreach ($data['items'] as $item) {
    $desc      = trim($item['desc']          ?? '');
    $hsn       = trim($item['hsn']           ?? '');
    $qty       = floatval($item['qty']        ?? 0);
    $per       = trim($item['per']            ?? 'NOS');
    $rate_incl = floatval($item['rateIncl']   ?? 0);
    $rate_excl = floatval($item['rateExcl']   ?? 0);
    $taxable   = floatval($item['taxableAmt'] ?? ($rate_excl * $qty));

    if (!$desc || $qty <= 0) continue;

    $iStmt->bind_param('issdsddd', $invoice_id, $desc, $hsn, $qty, $per, $rate_incl, $rate_excl, $taxable);
    $iStmt->execute();
}
$iStmt->close();

http_response_code($action === 'created' ? 201 : 200);
echo json_encode([
    'success'   => true,
    'message'   => "Invoice $action successfully",
    'id'        => $invoice_id,
    'client_id' => $client_id,
    'action'    => $action,
    'debug_phone' => $buyer_phone,
    'debug_branch_id' => $branch_id,
]);

$conn->close();