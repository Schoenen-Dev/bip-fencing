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
    echo json_encode(['error' => 'Please select a specific branch to deduct stock.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$product_id = trim($data['product_id'] ?? '');
$deduct_qty = (float)($data['deduct_qty'] ?? 0);
$note = trim($data['note'] ?? '');

if (empty($product_id) || $deduct_qty <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Product ID and valid deduction quantity required']);
    exit;
}

$conn = getDB();

// Get current stock
$stmt = $conn->prepare("SELECT current_stock FROM product_stock WHERE product_id = ? AND branch_id = ?");
$stmt->bind_param('si', $product_id, $branchId);
$stmt->execute();
$result = $stmt->get_result();
$stock = $result->fetch_assoc();

if (!$stock) {
    http_response_code(404);
    echo json_encode(['error' => 'Product not found in stock for this branch']);
    exit;
}

$current_stock = (float)$stock['current_stock'];
if ($deduct_qty > $current_stock) {
    http_response_code(400);
    echo json_encode(['error' => "Insufficient stock. Available: $current_stock"]);
    exit;
}

$new_stock = $current_stock - $deduct_qty;

$update = $conn->prepare("UPDATE product_stock SET current_stock = ? WHERE product_id = ? AND branch_id = ?");
$update->bind_param('dsi', $new_stock, $product_id, $branchId);
$update->execute();

// Log deduction
$log = $conn->prepare("INSERT INTO stock_deductions (product_id, branch_id, deducted_qty, note, deducted_at) VALUES (?, ?, ?, ?, NOW())");
$log->bind_param('sids', $product_id, $branchId, $deduct_qty, $note);
$log->execute();

echo json_encode(['success' => true, 'new_stock' => $new_stock]);
$conn->close();
?>