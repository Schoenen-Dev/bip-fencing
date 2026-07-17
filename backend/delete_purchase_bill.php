<?php
// =============================================================
// delete_purchase_bill.php  —  POST (JSON) { bill_id }
// ADMIN ONLY. Reverses the bill's item quantities from
// purchase_stock, then deletes the bill (items + payments are
// removed automatically via ON DELETE CASCADE).
// =============================================================
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($authUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['message' => 'Only admin can delete purchase bills']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$billId = (int)($data['bill_id'] ?? 0);

if ($billId <= 0) {
    http_response_code(400);
    echo json_encode(['message' => 'Valid bill_id required']);
    exit;
}

$conn = getDB();
$conn->begin_transaction();

try {
    $stmt = $conn->prepare("SELECT id, branch_id FROM purchase_bills WHERE id = ? FOR UPDATE");
    $stmt->bind_param('i', $billId);
    $stmt->execute();
    $bill = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$bill) {
        throw new Exception('Purchase bill not found');
    }
    $branchId = (int)$bill['branch_id'];

    // Reverse stock for each item in the bill
    $itemStmt = $conn->prepare("SELECT product_id, quantity FROM purchase_bill_items WHERE purchase_bill_id = ?");
    $itemStmt->bind_param('i', $billId);
    $itemStmt->execute();
    $items = $itemStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $itemStmt->close();

    $revStmt = $conn->prepare(
        "UPDATE purchase_stock
            SET total_purchased = GREATEST(total_purchased - ?, 0),
                current_stock   = current_stock - ?
          WHERE product_id = ? AND branch_id = ?"
    );
    foreach ($items as $item) {
        $q = (float)$item['quantity'];
        $revStmt->bind_param('ddsi', $q, $q, $item['product_id'], $branchId);
        $revStmt->execute();
    }
    $revStmt->close();

    // Delete the bill (items + payments cascade)
    $delStmt = $conn->prepare("DELETE FROM purchase_bills WHERE id = ?");
    $delStmt->bind_param('i', $billId);
    $delStmt->execute();
    $delStmt->close();

    $conn->commit();
    echo json_encode(['message' => 'Purchase bill deleted successfully']);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
?>