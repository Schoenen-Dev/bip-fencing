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
$action = $_GET['action'] ?? null;
$damageView = isset($_GET['damage']);

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
if ($method === 'GET' && $damageView) {
    $sql = "
        SELECT dl.id, dl.product_id, dl.damage_date, dl.qty,
               p.product_name, p.stock_qty, p.branch_id
        FROM stock_damage_log dl
        JOIN products p ON p.id = dl.product_id
    ";
    $params = [];
    $types = '';

    if ($effectiveBranch !== null) {
        $sql .= " WHERE p.branch_id = ?";
        $params[] = $effectiveBranch;
        $types = 'i';
    }
    $sql .= " ORDER BY dl.damage_date DESC, dl.id DESC";

    $stmt = $conn->prepare($sql);
    if (!$stmt) respond(500, ['error' => 'Prepare failed: ' . $conn->error]);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    respond(200, $rows);
}

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

// ── POST: Stock In / Stock Out ──────────────────────────────────
if ($method === 'POST' && ($action === 'stock-in' || $action === 'stock-out')) {
    if (!$id) respond(400, ['error' => 'Missing ?id=']);

    $chk = $conn->prepare("SELECT id, branch_id, stock_qty FROM products WHERE id = ?");
    $chk->bind_param('i', $id);
    $chk->execute();
    $product = $chk->get_result()->fetch_assoc();
    if (!$product) respond(404, ['error' => 'Product not found']);
    if ($effectiveBranch !== null && (int)$product['branch_id'] !== $effectiveBranch) {
        respond(403, ['error' => 'Access denied – product not in your branch']);
    }

    if ($action === 'stock-in') {
        $d = getBody();
        $qty = (int)($d['qty'] ?? 0);
        if ($qty <= 0) respond(422, ['error' => 'Enter a valid quantity']);

        $stmt = $conn->prepare("UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?");
        $stmt->bind_param('ii', $qty, $id);
        $stmt->execute();
    } else {
        if ((int)$product['stock_qty'] <= 0) respond(409, ['error' => 'No stock available to remove']);

        $stmt = $conn->prepare("UPDATE products SET stock_qty = stock_qty - 1 WHERE id = ? AND stock_qty > 0");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        if ($stmt->affected_rows === 0) respond(409, ['error' => 'No stock available to remove']);

        $branchId = $product['branch_id'];
        $log = $conn->prepare("
            INSERT INTO stock_damage_log (product_id, branch_id, damage_date, qty)
            VALUES (?, ?, CURDATE(), 1)
            ON DUPLICATE KEY UPDATE qty = qty + 1
        ");
        $log->bind_param('ii', $id, $branchId);
        $log->execute();
    }

    $result = $conn->query("SELECT * FROM products WHERE id = $id");
    respond(200, $result->fetch_assoc());
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
    $hsn         = $d['hsn']          ?? '';
    $unit        = $d['unit']         ?? 'Pcs';
    $productDate = $d['productDate']  ?? date('Y-m-d');
    $factoryPrice = $d['factoryPrice'] ?? 0;
    $sellingPrice = $d['sellingPrice'] ?? 0;
    $stockQty    = $d['stockQty']     ?? 0;
    $minStock    = $d['minStock']     ?? 0;
    $description = $d['description']  ?? '';

    $stmt = $conn->prepare("
        INSERT INTO products (product_name, hsn, unit, product_date, factory_price, selling_price, stock_qty, min_stock, description, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('ssssddissi', $productName, $hsn, $unit, $productDate, $factoryPrice, $sellingPrice, $stockQty, $minStock, $description, $branchId);

    try {
        $stmt->execute();
    } catch (mysqli_sql_exception $e) {
        if ($e->getCode() == 1062) respond(409, ['error' => 'HSN already exists']);
        respond(500, ['error' => $e->getMessage()]);
    }

    $newId = $conn->insert_id;
    $result = $conn->query("SELECT * FROM products WHERE id = $newId");
    respond(201, $result->fetch_assoc());
}

// ── PUT: Update damage log entry ────────────────────────────────
if ($method === 'PUT' && $damageView) {
    if (!$id) respond(400, ['error' => 'Missing ?id=']);
    $d = getBody();
    $newQty = (int)($d['qty'] ?? 0);
    $newDate = $d['damageDate'] ?? null;
    if ($newQty <= 0) respond(422, ['error' => 'Quantity must be at least 1']);
    if (!$newDate) respond(422, ['error' => 'Damage date is required']);

    $chk = $conn->prepare("
        SELECT dl.id, dl.qty AS old_qty, dl.product_id, p.branch_id, p.stock_qty
        FROM stock_damage_log dl
        JOIN products p ON p.id = dl.product_id
        WHERE dl.id = ?
    ");
    $chk->bind_param('i', $id);
    $chk->execute();
    $row = $chk->get_result()->fetch_assoc();
    if (!$row) respond(404, ['error' => 'Damage record not found']);
    if ($effectiveBranch !== null && (int)$row['branch_id'] !== $effectiveBranch) {
        respond(403, ['error' => 'Access denied – record not in your branch']);
    }

    $delta = $newQty - (int)$row['old_qty'];
    if ($delta > 0 && (int)$row['stock_qty'] < $delta) {
        respond(409, ['error' => 'Not enough stock available to increase damaged quantity']);
    }

    $conn->begin_transaction();
    try {
        $upd = $conn->prepare("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?");
        $upd->bind_param('ii', $delta, $row['product_id']);
        $upd->execute();

        $updLog = $conn->prepare("UPDATE stock_damage_log SET qty = ?, damage_date = ? WHERE id = ?");
        $updLog->bind_param('isi', $newQty, $newDate, $id);
        $updLog->execute();

        $conn->commit();
    } catch (mysqli_sql_exception $e) {
        $conn->rollback();
        if ($e->getCode() == 1062) respond(409, ['error' => 'A damage record already exists for this product on that date']);
        respond(500, ['error' => $e->getMessage()]);
    }

    respond(200, ['message' => 'Damage record updated']);
}

// ── DELETE: Remove damage log entry ─────────────────────────────
if ($method === 'DELETE' && $damageView) {
    if (!$id) respond(400, ['error' => 'Missing ?id=']);

    $chk = $conn->prepare("
        SELECT dl.id, dl.qty, dl.product_id, p.branch_id
        FROM stock_damage_log dl
        JOIN products p ON p.id = dl.product_id
        WHERE dl.id = ?
    ");
    $chk->bind_param('i', $id);
    $chk->execute();
    $row = $chk->get_result()->fetch_assoc();
    if (!$row) respond(404, ['error' => 'Damage record not found']);
    if ($effectiveBranch !== null && (int)$row['branch_id'] !== $effectiveBranch) {
        respond(403, ['error' => 'Access denied – record not in your branch']);
    }

    $conn->begin_transaction();
    try {
        $back = $conn->prepare("UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?");
        $back->bind_param('ii', $row['qty'], $row['product_id']);
        $back->execute();

        $del = $conn->prepare("DELETE FROM stock_damage_log WHERE id = ?");
        $del->bind_param('i', $id);
        $del->execute();

        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
        respond(500, ['error' => $e->getMessage()]);
    }

    respond(200, ['message' => 'Damage record deleted', 'id' => $id]);
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
    $hsn         = $d['hsn']          ?? '';
    $unit        = $d['unit']         ?? 'Pcs';
    $productDate = $d['productDate']  ?? date('Y-m-d');
    $factoryPrice= $d['factoryPrice'] ?? 0;
    $sellingPrice= $d['sellingPrice'] ?? 0;
    $stockQty    = $d['stockQty']     ?? 0;
    $minStock    = $d['minStock']     ?? 0;
    $description = $d['description']  ?? '';

    $stmt = $conn->prepare("
        UPDATE products SET
            product_name=?, hsn=?, unit=?, product_date=?,
            factory_price=?, selling_price=?, stock_qty=?, min_stock=?, description=?
        WHERE id=?
    ");
    $stmt->bind_param('ssssddissi', $productName, $hsn, $unit, $productDate, $factoryPrice, $sellingPrice, $stockQty, $minStock, $description, $id);

    try {
        if (!$stmt->execute()) {
            if ($conn->errno == 1062) respond(409, ['error' => 'HSN already exists']);
            respond(500, ['error' => 'Update failed: ' . $conn->error]);
        }
    } catch (mysqli_sql_exception $e) {
        if ($e->getCode() == 1062) respond(409, ['error' => 'HSN already exists']);
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