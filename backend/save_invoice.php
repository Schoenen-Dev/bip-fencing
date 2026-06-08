<?php
// ============================================================
//  save_invoice.php
//  Protected by auth_middleware — branch_id comes from token,
//  NO need to send branch_id from frontend at all.
// ============================================================

require_once __DIR__ . '/auth_middleware.php'; // sets $authUser
// $authUser['branch_id'] = branch user's branch (null for admin)

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

require_once __DIR__ . '/db.php'; // gives $conn (mysqli)

$raw  = file_get_contents("php://input");
$data = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE || !$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid JSON: " . json_last_error_msg()]);
    exit;
}

// Required fields check
$required = [
    "invoice_no","invoice_date","buyer_name","buyer_address",
    "buyer_phone","buyer_gst","description","hsn",
    "qty","rate","amount","subtotal","cgst","sgst","total_tax","net_amount"
];
$missing = [];
foreach ($required as $f) {
    if (!isset($data[$f]) || $data[$f] === '') $missing[] = $f;
}
if (!empty($missing)) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "Missing fields", "missing" => $missing]);
    exit;
}

// ── branch_id: comes from the logged-in user's token ─────────
// branch_user  → their own branch_id  (e.g. 1, 2, 3)
// admin        → NULL (not tied to any branch)
$branch_id = $authUser['branch_id'] ?? null;

$invoice_no    = $data['invoice_no'];
$invoice_date  = $data['invoice_date'];
$buyer_name    = $data['buyer_name'];
$buyer_address = $data['buyer_address'];
$buyer_phone   = $data['buyer_phone'];
$buyer_gst     = $data['buyer_gst'];
$description   = $data['description'];
$hsn           = $data['hsn'];
$qty           = floatval($data['qty']);
$rate          = floatval($data['rate']);
$amount        = floatval($data['amount']);
$subtotal      = floatval($data['subtotal']);
$cgst          = floatval($data['cgst']);
$sgst          = floatval($data['sgst']);
$total_tax     = floatval($data['total_tax']);
$net_amount    = floatval($data['net_amount']);

$stmt = $conn->prepare("
    INSERT INTO invoices (
        invoice_no, invoice_date, buyer_name, buyer_address, buyer_phone, buyer_gst,
        description, hsn, qty, rate, amount,
        subtotal, cgst, sgst, total_tax, net_amount,
        branch_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
    exit;
}

$stmt->bind_param(
    "ssssssssddddddddi",
    $invoice_no, $invoice_date, $buyer_name, $buyer_address, $buyer_phone, $buyer_gst,
    $description, $hsn, $qty, $rate, $amount,
    $subtotal, $cgst, $sgst, $total_tax, $net_amount,
    $branch_id
);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        "success"    => true,
        "message"    => "Invoice Saved Successfully",
        "id"         => $conn->insert_id,
        "branch_id"  => $branch_id   // confirm what was stored
    ]);
} else {
    if ($conn->errno === 1062) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Invoice No '$invoice_no' already exists."]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $stmt->error]);
    }
}

$stmt->close();
$conn->close();
?>