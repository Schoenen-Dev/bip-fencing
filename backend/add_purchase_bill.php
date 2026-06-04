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

$company_name  = trim($data['company_name'] ?? '');
$product_name  = trim($data['product_name'] ?? '');
$product_id    = trim($data['product_id'] ?? '');
$quantity      = (float)($data['quantity'] ?? 0);
$rate          = (float)($data['rate'] ?? 0);
$invoice_no    = trim($data['invoice_no'] ?? '');
$total_amount  = (float)($data['total_amount'] ?? 0);

if (empty($company_name) || empty($product_name) || $quantity <= 0 || $rate <= 0 || empty($invoice_no)) {
    http_response_code(400);
    echo json_encode(['message' => 'Company Name, Product Name, Quantity, Rate and Invoice No are required']);
    exit;
}

$conn = getDB();
$stmt = $conn->prepare("
    INSERT INTO purchase_bills 
    (company_name, product_name, product_id, quantity, rate, invoice_no, total_amount, branch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['message' => 'Prepare failed: ' . $conn->error]);
    exit;
}

// 8 parameters: 
// 1 string (company_name), 2 string (product_name), 3 string (product_id),
// 4 double (quantity), 5 double (rate), 6 string (invoice_no),
// 7 double (total_amount), 8 int (branch_id)
// Type string: s s s d d s d i  -> "sssddsdi"
$stmt->bind_param('sssddsdi', $company_name, $product_name, $product_id, $quantity, $rate, $invoice_no, $total_amount, $branchId);

if ($stmt->execute()) {
    echo json_encode(['message' => 'Purchase bill saved successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Execute failed: ' . $stmt->error]);
}
$stmt->close();
$conn->close();
?>