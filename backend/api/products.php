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
    $stmt = $pdo->query('SELECT * FROM products ORDER BY created_at DESC');
    $rows = $stmt->fetchAll();
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

    $margin = '';

    $stmt = $pdo->prepare('
        INSERT INTO products
            (product_name, sku, category, unit, selling_price, stock_qty, min_stock, description)
        VALUES
            (:product_name, :sku, :category, :unit, :selling_price, :stock_qty, :min_stock, :description)
    ');

    $stmt->execute([
        ':product_name'  => $d['productName'],
        ':sku'           => $d['sku']          ?? '',
        ':category'      => $d['category']     ?? '',
        ':unit'          => $d['unit']          ?? 'Pcs',
        
        ':selling_price' => $d['sellingPrice']  ?? 0,
        
        ':stock_qty'     => $d['stockQty']      ?? 0,
        ':min_stock'     => $d['minStock']       ?? 0,
        ':description'   => $d['description']   ?? '',
    ]);

    $newId = (int) $pdo->lastInsertId();
    $newProduct = $pdo->query("SELECT * FROM products WHERE id = $newId")->fetch();
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

    

    $stmt = $pdo->prepare('
        UPDATE products SET
            product_name  = :product_name,
            sku           = :sku,
            category      = :category,
            unit          = :unit,
            
            selling_price = :selling_price,
            
            stock_qty     = :stock_qty,
            min_stock     = :min_stock,
            description   = :description
        WHERE id = :id
    ');

    $stmt->execute([
        ':product_name'  => $d['productName'],
        ':sku'           => $d['sku']          ?? '',
        ':category'      => $d['category']     ?? '',
        ':unit'          => $d['unit']          ?? 'Pcs',
        
        ':selling_price' => $d['sellingPrice']  ?? 0,
        
        ':stock_qty'     => $d['stockQty']      ?? 0,
        ':min_stock'     => $d['minStock']       ?? 0,
        ':description'   => $d['description']   ?? '',
        ':id'            => $id,
    ]);

    if ($stmt->rowCount() === 0) respond(404, ['error' => 'Product not found']);

    $updated = $pdo->query("SELECT * FROM products WHERE id = $id")->fetch();
    respond(200, $updated);
}

// ════════════════════════════════════════════
//  DELETE — Delete a product by ID
// ════════════════════════════════════════════
if ($method === 'DELETE') {
    if (!$id) respond(400, ['error' => 'Missing ?id=']);

    $stmt = $pdo->prepare('DELETE FROM products WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) respond(404, ['error' => 'Product not found']);

    respond(200, ['message' => 'Product deleted', 'id' => $id]);
}

// ── Fallback ──
respond(405, ['error' => 'Method not allowed']);
