<?php
// ============================================================
//  File: api/products.php
//  Place this inside: C:\xampp\htdocs\inventory\api\products.php
//
//  Endpoints:
//    GET    /api/products.php          → list all products
//    POST   /api/products.php          → create a product
//    PUT    /api/products.php?id=X     → update product by ID
//    DELETE /api/products.php?id=X     → delete product by ID
// ============================================================

// ── CORS: allow your React dev server (localhost:5173 or :3000) ──
header('Access-Control-Allow-Origin: *');
// For any local origin during development, use:
// header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$conn = getDB();

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;

// ── Helper: send JSON response ──
function respond(int $code, $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ── Helper: read JSON body ──
function getBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) respond(400, ['error' => 'Invalid JSON body']);
    return $data;
}

// ── Compute margin string ──
// function calcMargin($cost, $sell): string {
//     $cost = (float) $cost;
//     $sell = (float) $sell;
//     if ($cost <= 0) return '0%';
//     return round((($sell - $cost) / $cost) * 100, 1) . '%';
// }

// ════════════════════════════════════════════
//  GET — List all products
// ════════════════════════════════════════════
if ($method === 'GET') {
    $result = $conn->query("SELECT * FROM products ORDER BY created_at DESC");

$rows = [];

while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

respond(200, $rows);
}

// ════════════════════════════════════════════
//  POST — Create a new product
// ════════════════════════════════════════════
if ($method === 'POST') {
    $d = getBody();

    // Validate required field
    if (empty($d['productName'])) {
        respond(422, ['error' => 'productName is required']);
    }

    

    $stmt = $conn->prepare("
    INSERT INTO products
    (
        product_name,
        sku,
        category,
        unit,
        selling_price,
        stock_qty,
        min_stock,
        description
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

$productName = $d['productName'];
$sku         = $d['sku'] ?? '';
$category    = $d['category'] ?? '';
$unit        = $d['unit'] ?? 'Pcs';
$sellingPrice= $d['sellingPrice'] ?? 0;
$stockQty    = $d['stockQty'] ?? 0;
$minStock    = $d['minStock'] ?? 0;
$description = $d['description'] ?? '';

$stmt->bind_param(
    "ssssdiss",
    $productName,
    $sku,
    $category,
    $unit,
    $sellingPrice,
    $stockQty,
    $minStock,
    $description
);

try {
    $stmt->execute();
} catch (mysqli_sql_exception $e) {

    if ($e->getCode() == 1062) {
        respond(409, ['error' => 'SKU already exists']);
    }

    respond(500, ['error' => $e->getMessage()]);
}

$newId = $conn->insert_id;

$result = $conn->query("SELECT * FROM products WHERE id = $newId");
$newProduct = $result->fetch_assoc();

respond(201, $newProduct);
}

// ════════════════════════════════════════════
//  PUT — Update a product by ID
// ════════════════════════════════════════════
if ($method === 'PUT') {
    if (!$id) respond(400, ['error' => 'Missing ?id=']);

    $d = getBody();

    if (empty($d['productName'])) {
        respond(422, ['error' => 'productName is required']);
    }

    

    $stmt = $conn->prepare("
    UPDATE products SET
        product_name = ?,
        sku = ?,
        category = ?,
        unit = ?,
        selling_price = ?,
        stock_qty = ?,
        min_stock = ?,
        description = ?
    WHERE id = ?
");

$productName = $d['productName'];
$sku         = $d['sku'] ?? '';
$category    = $d['category'] ?? '';
$unit        = $d['unit'] ?? 'Pcs';
$sellingPrice= $d['sellingPrice'] ?? 0;
$stockQty    = $d['stockQty'] ?? 0;
$minStock    = $d['minStock'] ?? 0;
$description = $d['description'] ?? '';

$stmt->bind_param(
    "ssssdissi",
    $productName,
    $sku,
    $category,
    $unit,
    $sellingPrice,
    $stockQty,
    $minStock,
    $description,
    $id
);

try {
    $stmt->execute();
} catch (mysqli_sql_exception $e) {

    if ($e->getCode() == 1062) {
        respond(409, ['error' => 'SKU already exists']);
    }

    respond(500, ['error' => $e->getMessage()]);
}

$result = $conn->query("SELECT * FROM products WHERE id = $id");
$updated = $result->fetch_assoc();

respond(200, $updated);
}

// ════════════════════════════════════════════
//  DELETE — Delete a product by ID
// ════════════════════════════════════════════
if ($method === 'DELETE') {
    if (!$id) respond(400, ['error' => 'Missing ?id=']);

    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        respond(404, ['error' => 'Product not found']);
    }

    respond(200, [
        'message' => 'Product deleted',
        'id' => $id
    ]);
}

// ── Fallback ──
respond(405, ['error' => 'Method not allowed']);
