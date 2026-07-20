<?php
// =============================================================
// set_low_stock.php  —  POST (JSON)  —  ADMIN ONLY
// { product_id, branch_id, min_stock }
// Sets the low-stock alert level for a product in a branch.
// =============================================================
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$product_id = trim($data['product_id'] ?? '');
$branch_id  = (int)($data['branch_id'] ?? 0);
$min_stock  = (float)($data['min_stock'] ?? 0);

// Admin can set alerts for any branch.
// Branch users can set alerts ONLY for their own branch.
if ($authUser['role'] !== 'admin') {
    if ((int)$authUser['branch_id'] !== $branch_id) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only set alerts for your own branch']);
        exit;
    }
}

if ($product_id === '' || $branch_id <= 0 || $min_stock < 0) {
    http_response_code(400);
    echo json_encode(['error' => 'product_id, branch_id and a non-negative min_stock are required']);
    exit;
}

$conn = getDB();

$stmt = $conn->prepare(
    "UPDATE purchase_stock SET min_stock = ? WHERE product_id = ? AND branch_id = ?"
);
$stmt->bind_param('dsi', $min_stock, $product_id, $branch_id);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    // Row may exist but the value was unchanged — verify it exists
    $chk = $conn->prepare("SELECT id FROM purchase_stock WHERE product_id = ? AND branch_id = ?");
    $chk->bind_param('si', $product_id, $branch_id);
    $chk->execute();
    if (!$chk->get_result()->fetch_assoc()) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found in this branch']);
        $chk->close();
        $stmt->close();
        $conn->close();
        exit;
    }
    $chk->close();
}

$stmt->close();
echo json_encode(['message' => 'Low stock alert updated', 'min_stock' => $min_stock]);
$conn->close();
?>