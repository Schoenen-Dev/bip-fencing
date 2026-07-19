<?php
require_once __DIR__ . '/auth_middleware.php'; // provides $pdo, $authUser

header('Cache-Control: no-store');

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

$pdo->exec("
    CREATE TABLE IF NOT EXISTS invoice_global_counter (
        id INT UNSIGNED NOT NULL PRIMARY KEY,
        last_number INT UNSIGNED NOT NULL DEFAULT 0
    ) ENGINE=InnoDB
");
$pdo->exec("INSERT IGNORE INTO invoice_global_counter (id, last_number) VALUES (1, 0)");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->query("SELECT last_number FROM invoice_global_counter WHERE id = 1 FOR UPDATE");
        $row  = $stmt->fetch();
        $next = ((int)($row['last_number'] ?? 0)) + 1;

        $upd = $pdo->prepare("UPDATE invoice_global_counter SET last_number = ? WHERE id = 1");
        $upd->execute([$next]);

        $pdo->commit();
    } catch (Exception $ex) {
        $pdo->rollBack();
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

$stmt = $pdo->query("SELECT last_number FROM invoice_global_counter WHERE id = 1");
$row  = $stmt->fetch();
$next = ((int)($row['last_number'] ?? 0)) + 1;

echo json_encode([
    'success'    => true,
    'invoice_no' => formatInvoiceNo($next),
    'branch_id'  => $branchId,
    'number'     => $next,
]);