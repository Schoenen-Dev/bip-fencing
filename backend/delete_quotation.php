<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

$id = (int)($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    echo json_encode(['message' => 'Quotation ID required']);
    exit;
}

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

$stmt = $conn->prepare("DELETE FROM quotations WHERE id = ?");
$stmt->bind_param('i', $id);
$stmt->execute();
if ($stmt->affected_rows > 0) {
    echo json_encode(['message' => 'Quotation deleted successfully']);
} else {
    http_response_code(404);
    echo json_encode(['message' => 'Quotation not found']);
}
$conn->close();
?>