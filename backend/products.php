<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

$conn   = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

function respond(int $code, $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getBody(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) respond(400, ['error' => 'Invalid JSON body']);
    return $data;
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

$effectiveBranch = getEffectiveBranchId($authUser);

// ── GET ───────────────────────────────────────────────────────
if ($method === 'GET') {
    $sql = "SELECT * FROM products";
    $params = [];
    $types = '';

    if ($effectiveBranch !== null) {
        $sql .= " WHERE branch_id = ?";
        $params[] = $effectiveBranch;
        $types = 'i';
    }
    $sql .= " ORDER BY created_at DESC";

    $stmt = $conn->prepare($sql);
    if (!$stmt) respond(500, ['error' => 'Prepare failed: ' . $conn->error]);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    respond(200, $rows);
}

// ── POST ──────────────────────────────────────────────────────
if ($method === 'POST') {
    $d = getBody();
    if (empty($d['productName'])) respond(422, ['error' => 'productName is required']);

    $branchId = $effectiveBranch;
    if ($branchId === null && $authUser['role'] === 'admin') {
        $branchId = (int)($d['branch_id'] ?? 0);
    }
    if (!$branchId) respond(400, ['error' => 'No branch selected. Please select a branch.']);

    $productName = $d['productName'];
    $sku         = $d['sku']          ?? '';
    $category    = $d['category']     ?? '';
    $unit        = $d['unit']         ?? 'Pcs';
    $sellingPrice = $d['sellingPrice'] ?? 0;
    $stockQty    = $d['stockQty']     ?? 0;
    $minStock    = $d['minStock']     ?? 0;
    $description = $d['description']  ?? '';

    $stmt = $conn->prepare("
        INSERT INTO products (product_name, sku, category, unit, selling_price, stock_qty, min_stock, description, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('ssssdissi', $productName, $sku, $category, $unit, $sellingPrice, $stockQty, $minStock, $description, $branchId);

    try {
        $stmt->execute();
    } catch (mysqli_sql_exception $e) {
        if ($e->getCode() == 1062) respond(409, ['error' => 'SKU already exists']);
        respond(500, ['error' => $e->getMessage()]);
    }

    $newId = $conn->insert_id;
    $result = $conn->query("SELECT * FROM products WHERE id = $newId");
    respond(201, $result->fetch_assoc());
}

// ── PUT ───────────────────────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) respond(400, ['error' => 'Missing ?id=']);
    $d = getBody();
    if (empty($d['productName'])) respond(422, ['error' => 'productName is required']);

    // Permission check
    if ($effectiveBranch !== null) {
        $chk = $conn->prepare("SELECT id FROM products WHERE id = ? AND branch_id = ?");
        $chk->bind_param('ii', $id, $effectiveBranch);
        $chk->execute();
        if (!$chk->get_result()->fetch_assoc()) respond(403, ['error' => 'Access denied – product not in your branch']);
    }

    $productName = $d['productName'];
    $sku         = $d['sku']          ?? '';
    $category    = $d['category']     ?? '';
    $unit        = $d['unit']         ?? 'Pcs';
    $sellingPrice= $d['sellingPrice'] ?? 0;
    $stockQty    = $d['stockQty']     ?? 0;
    $minStock    = $d['minStock']     ?? 0;
    $description = $d['description']  ?? '';

    $stmt = $conn->prepare("
        UPDATE products SET
            product_name=?, sku=?, category=?, unit=?,
            selling_price=?, stock_qty=?, min_stock=?, description=?
        WHERE id=?
    ");
    $stmt->bind_param('ssssdissi', $productName, $sku, $category, $unit, $sellingPrice, $stockQty, $minStock, $description, $id);

    try {
        $stmt->execute();
    } catch (mysqli_sql_exception $e) {
        if ($e->getCode() == 1062) respond(409, ['error' => 'SKU already exists']);
        respond(500, ['error' => $e->getMessage()]);
    }

    $result = $conn->query("SELECT * FROM products WHERE id = $id");
    respond(200, $result->fetch_assoc());
}

// ── DELETE ────────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) respond(400, ['error' => 'Missing ?id=']);

    if ($effectiveBranch !== null) {
        $chk = $conn->prepare("SELECT id FROM products WHERE id = ? AND branch_id = ?");
        $chk->bind_param('ii', $id, $effectiveBranch);
        $chk->execute();
        if (!$chk->get_result()->fetch_assoc()) respond(403, ['error' => 'Access denied – product not in your branch']);
    }

    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    if ($stmt->affected_rows === 0) respond(404, ['error' => 'Product not found']);
    respond(200, ['message' => 'Product deleted', 'id' => $id]);
}

respond(405, ['error' => 'Method not allowed']);
?>