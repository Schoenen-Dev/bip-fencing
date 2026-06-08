<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
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

// 1. Insert into purchase_bills
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
// 8 placeholders: s,s,s,d,d,s,d,i => 'sssddsdi'
$stmt->bind_param('sssddsdi', $company_name, $product_name, $product_id, $quantity, $rate, $invoice_no, $total_amount, $branchId);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['message' => 'Insert failed: ' . $stmt->error]);
    exit;
}
$stmt->close();

// 2. Update or insert product_stock
$check = $conn->prepare("SELECT id, total_purchased, current_stock, rate FROM product_stock WHERE product_id = ? AND branch_id = ?");
$check->bind_param('si', $product_id, $branchId);
$check->execute();
$existing = $check->get_result()->fetch_assoc();
$check->close();

if ($existing) {
    $old_total = (float)$existing['total_purchased'];
    $old_stock = (float)$existing['current_stock'];
    $old_rate = (float)$existing['rate'];
    $new_total = $old_total + $quantity;
    $new_stock = $old_stock + $quantity;
    $new_rate = ($old_total * $old_rate + $quantity * $rate) / $new_total;
    $update = $conn->prepare("UPDATE product_stock SET total_purchased = ?, current_stock = ?, rate = ? WHERE product_id = ? AND branch_id = ?");
    // 5 placeholders: d,d,d,s,i => 'dddsi'
    $update->bind_param('dddsi', $new_total, $new_stock, $new_rate, $product_id, $branchId);
    if (!$update->execute()) {
        http_response_code(500);
        echo json_encode(['message' => 'Update product_stock failed: ' . $update->error]);
        exit;
    }
    $update->close();
} else {
    $insert = $conn->prepare("INSERT INTO product_stock (product_id, product_name, total_purchased, current_stock, rate, branch_id) VALUES (?, ?, ?, ?, ?, ?)");
    // 6 placeholders: s,s,d,d,d,i => 'ssdddi'
    $insert->bind_param('ssdddi', $product_id, $product_name, $quantity, $quantity, $rate, $branchId);
    if (!$insert->execute()) {
        http_response_code(500);
        echo json_encode(['message' => 'Insert product_stock failed: ' . $insert->error]);
        exit;
    }
    $insert->close();
}

echo json_encode(['message' => 'Purchase bill saved and stock updated successfully']);
$conn->close();
?>