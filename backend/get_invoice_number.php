<?php
// =============================================================
//  get_invoice_number.php
//  GLOBAL invoice numbering: BFCWS-{number}
//  ONE shared counter for ALL branches. Lives in its own table
//  (invoice_global_counter) — deliberately NOT tied to branches
//  via any foreign key, so it can never silently fail to save
//  like a fake branch_id would in the old per-branch table.
//
//  GET  -> "peek" the next number. Does NOT touch the counter.
//  POST -> "reserve" the next number: atomically increments the
//          single counter (locked with FOR UPDATE) so it's
//          permanently consumed — Branch A reserves 001, next
//          peek anywhere is 002, then 003, etc.
// =============================================================

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

header('Cache-Control: no-store'); // never let the browser cache this

function formatInvoiceNo(int $number): string {
    return 'BFCWS-' . str_pad((string)$number, 3, '0', STR_PAD_LEFT);
}

$branchId = $authUser['view_branch_id'] ?? null;

if (!$branchId) {
    echo json_encode([
        'success' => false,
        'message' => 'no_branch_selected',
    ]);
    exit;
}
$branchId = (int)$branchId;

// ── Self-contained global counter table (created once, then reused) ──
$conn->query("
    CREATE TABLE IF NOT EXISTS invoice_global_counter (
        id INT UNSIGNED NOT NULL PRIMARY KEY,
        last_number INT UNSIGNED NOT NULL DEFAULT 0
    ) ENGINE=InnoDB
");
$conn->query("INSERT IGNORE INTO invoice_global_counter (id, last_number) VALUES (1, 0)");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // ── Reserve: atomically increment the GLOBAL counter ───────
    $conn->begin_transaction();
    try {
        $res  = $conn->query("SELECT last_number FROM invoice_global_counter WHERE id = 1 FOR UPDATE");
        $row  = $res ? $res->fetch_assoc() : null;
        $next = ((int)($row['last_number'] ?? 0)) + 1;

        $upd = $conn->prepare("UPDATE invoice_global_counter SET last_number = ? WHERE id = 1");
        $upd->bind_param('i', $next);
        $upd->execute();
        $upd->close();

        $conn->commit();
    } catch (Exception $ex) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to reserve invoice number']);
        exit;
    }

    echo json_encode([
        'success'    => true,
        'invoice_no' => formatInvoiceNo($next),
        'branch_id'  => $branchId,
        'number'     => $next,
    ]);
    exit;
}

// ── GET: peek only — does not change the counter ───────────────
$res  = $conn->query("SELECT last_number FROM invoice_global_counter WHERE id = 1");
$row  = $res ? $res->fetch_assoc() : null;
$next = ((int)($row['last_number'] ?? 0)) + 1;

echo json_encode([
    'success'    => true,
    'invoice_no' => formatInvoiceNo($next),
    'branch_id'  => $branchId,
    'number'     => $next,
]);