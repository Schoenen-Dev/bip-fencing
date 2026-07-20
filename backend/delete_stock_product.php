<?php
// =============================================================
// delete_stock_product.php  —  POST (JSON)  —  ADMIN ONLY
// { product_id, branch_id }
// Removes a product row from purchase_stock for a branch.
// (Purchase bill history and deduction history are kept.)
// =============================================================
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($authUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Only admin can delete products']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$product_id = trim($data['product_id'] ?? '');
$branch_id  = (int)($data['branch_id'] ?? 0);

if ($product_id === '' || $branch_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'product_id and branch_id are required']);
    exit;
}

$conn = getDB();

$stmt = $conn->prepare("DELETE FROM purchase_stock WHERE product_id = ? AND branch_id = ?");
$stmt->bind_param('si', $product_id, $branch_id);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Product not found in this branch']);
} else {
    echo json_encode(['message' => 'Product deleted from inventory']);
}

$stmt->close();
$conn->close();
?>