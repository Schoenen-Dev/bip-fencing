<?php
    // ============================================================
    //  client.php  –  Client management API
    //
    //  GET  /client.php                     → all clients with balance summary
    //  GET  /client.php?client_id=1         → single client + all invoices
    //  GET  /client.php?invoice_no=INV-001  → single invoice with items (for View bill)
    //  POST /client.php                     → record a payment
    //  DELETE /client.php?payment_id=1      → delete a payment
    // ============================================================

    require_once __DIR__ . '/auth_middleware.php';
    require_once __DIR__ . '/db.php';

    $method = $_SERVER['REQUEST_METHOD'];

    // ── Branch resolution ─────────────────────────────────────────
    // Used when recording a payment (tag it with the acting branch context).
    $branch_id = null;
    if ($authUser['role'] === 'admin' && isset($authUser['view_branch_id'])) {
        $branch_id = $authUser['view_branch_id'];
    } elseif ($authUser['role'] !== 'admin') {
        $branch_id = $authUser['branch_id'];
    }

    // Used when listing clients — admin always sees every branch's clients,
    // even while impersonating a specific branch elsewhere in the app. Only
    // non-admin branch users are scoped to their own branch.
    $list_branch_id = ($authUser['role'] !== 'admin') ? $authUser['branch_id'] : null;

    switch ($method) {

        // ----------------------------------------------------------
        //  GET
        // ----------------------------------------------------------
        case 'GET':

            // ── Single invoice with items (for View Bill) ─────────
            if (!empty($_GET['invoice_no'])) {
                $invoice_no = $_GET['invoice_no'];

                $stmt = $conn->prepare("SELECT * FROM invoices WHERE invoice_no = ?");
                $stmt->bind_param('s', $invoice_no);
                $stmt->execute();
                $invoice = $stmt->get_result()->fetch_assoc();
                $stmt->close();

                if (!$invoice) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Invoice not found']);
                    exit;
                }

                $iStmt = $conn->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC");
                $iStmt->bind_param('i', $invoice['id']);
                $iStmt->execute();
                $items = $iStmt->get_result()->fetch_all(MYSQLI_ASSOC);
                $iStmt->close();

                $invoice['items'] = $items;
                echo json_encode(['success' => true, 'invoice' => $invoice]);
                break;
            }

            // ── Single client detail + invoices + payments ────────
            if (!empty($_GET['client_id'])) {
                $client_id = (int) $_GET['client_id'];

                $cStmt = $conn->prepare("SELECT * FROM clients WHERE id = ?");
                $cStmt->bind_param('i', $client_id);
                $cStmt->execute();
                $client = $cStmt->get_result()->fetch_assoc();
                $cStmt->close();

                if (!$client) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Client not found']);
                    exit;
                }

                // All invoices for this client
                $invStmt = $conn->prepare("
                    SELECT id, invoice_no, invoice_date, net_amount, payment_mode
                    FROM invoices WHERE client_id = ? ORDER BY invoice_date DESC
                ");
                $invStmt->bind_param('i', $client_id);
                $invStmt->execute();
                $invoices = $invStmt->get_result()->fetch_all(MYSQLI_ASSOC);
                $invStmt->close();

                // All payments for this client
                $pStmt = $conn->prepare("
                    SELECT * FROM client_payments WHERE client_id = ? ORDER BY payment_date DESC
                ");
                $pStmt->bind_param('i', $client_id);
                $pStmt->execute();
                $payments = $pStmt->get_result()->fetch_all(MYSQLI_ASSOC);
                $pStmt->close();

                // All quotations for this client
                $qStmt = $conn->prepare("
                    SELECT q.id, q.quote_no, q.quote_date, q.valid_until, q.discount_percent, q.is_gst, q.tax_percent,
                        (SELECT COALESCE(SUM(quantity * rate),0) FROM quotation_items WHERE quotation_id = q.id) AS subtotal
                    FROM quotations q WHERE q.client_id = ? ORDER BY q.quote_date DESC
                ");
                $qStmt->bind_param('i', $client_id);
                $qStmt->execute();
                $quotations = $qStmt->get_result()->fetch_all(MYSQLI_ASSOC);
                $qStmt->close();

                foreach ($quotations as &$q) {
                    $sub      = (float) $q['subtotal'];
                    $discAmt  = $sub * (float) $q['discount_percent'] / 100;
                    $taxable  = $sub - $discAmt;
                    $taxRate  = ((int) $q['is_gst'] === 1) ? (float) $q['tax_percent'] : 0;
                    $taxAmt   = $taxable * $taxRate / 100;
                    $roundOff = round($taxable + $taxAmt) - ($taxable + $taxAmt);
                    $q['grand_total'] = round($taxable + $taxAmt + $roundOff, 2);
                }
                unset($q);

                // Calculate balances
                $total_billed = array_sum(array_column($invoices, 'net_amount'));
                $total_paid   = array_sum(array_column($payments, 'amount'));
                $pending      = $total_billed - $total_paid;

                echo json_encode([
                    'success'       => true,
                    'client'        => $client,
                    'invoices'      => $invoices,
                    'payments'      => $payments,
                    'quotations'    => $quotations,
                    'total_billed'  => $total_billed,
                    'total_paid'    => $total_paid,
                    'pending'       => $pending,
                ]);
                break;
            }

            // ── All clients with balance summary ──────────────────
            if ($list_branch_id !== null) {
                $stmt = $conn->prepare("
                    SELECT
                        c.id,
                        c.name,
                        c.phone,
                        c.address,
                        c.gst,
                        c.created_at,
                        COUNT(i.id)        AS total_invoices,
                        MAX(i.invoice_date) AS last_invoice_date,
                        MAX(i.invoice_no)   AS last_invoice_no,
                        COALESCE(SUM(i.net_amount), 0)            AS total_billed,
                        COALESCE((
                            SELECT SUM(p.amount)
                            FROM client_payments p
                            WHERE p.client_id = c.id
                        ), 0)                                     AS total_paid,
                        COALESCE(SUM(i.net_amount), 0) - COALESCE((
                            SELECT SUM(p.amount)
                            FROM client_payments p
                            WHERE p.client_id = c.id
                        ), 0)                                     AS pending
                    FROM clients c
                    LEFT JOIN invoices i ON i.client_id = c.id
                    WHERE c.branch_id = ?
                    GROUP BY c.id
                    ORDER BY c.name ASC
                ");
                $stmt->bind_param('i', $list_branch_id);
                $stmt->execute();
                $clients = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                $stmt->close();
            } else {
                // Admin — all branches
                $result  = $conn->query("
                    SELECT
                        c.id,
                        c.name,
                        c.phone,
                        c.address,
                        c.gst,
                        c.created_at,
                        COUNT(i.id)         AS total_invoices,
                        MAX(i.invoice_date) AS last_invoice_date,
                        MAX(i.invoice_no)   AS last_invoice_no,
                        COALESCE(SUM(i.net_amount), 0)            AS total_billed,
                        COALESCE((
                            SELECT SUM(p.amount)
                            FROM client_payments p
                            WHERE p.client_id = c.id
                        ), 0)                                     AS total_paid,
                        COALESCE(SUM(i.net_amount), 0) - COALESCE((
                            SELECT SUM(p.amount)
                            FROM client_payments p
                            WHERE p.client_id = c.id
                        ), 0)                                     AS pending
                    FROM clients c
                    LEFT JOIN invoices i ON i.client_id = c.id
                    GROUP BY c.id
                    ORDER BY c.name ASC
                ");
                $clients = $result->fetch_all(MYSQLI_ASSOC);
            }

            echo json_encode(['success' => true, 'clients' => $clients]);
            break;

        // ----------------------------------------------------------
        //  POST – Record a payment for a client
        // ----------------------------------------------------------
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['client_id']) || empty($data['amount']) || empty($data['payment_date'])) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'client_id, amount and payment_date are required']);
                exit;
            }

            $client_id    = (int) $data['client_id'];
            $amount       = floatval($data['amount']);
            $note         = trim($data['note'] ?? '');
            $payment_date = $data['payment_date'];

            $stmt = $conn->prepare("
                INSERT INTO client_payments (client_id, amount, note, payment_date, branch_id)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->bind_param('idssi', $client_id, $amount, $note, $payment_date, $branch_id);

            if (!$stmt->execute()) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => $stmt->error]);
                exit;
            }

            echo json_encode([
                'success'    => true,
                'message'    => 'Payment recorded successfully',
                'payment_id' => $conn->insert_id,
            ]);
            $stmt->close();
            break;

        // ----------------------------------------------------------
        //  DELETE – Remove a payment record
        // ----------------------------------------------------------
// FIND THIS (around line 155):
// REPLACE WITH:
case 'DELETE':
    $client_id = (int) ($_GET['client_id'] ?? 0);
    if (!$client_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'client_id required']);
        exit;
    }
    $stmt = $conn->prepare("DELETE FROM client_payments WHERE client_id = ?");
    $stmt->bind_param('i', $client_id);
    $stmt->execute();
    $stmt->close();
    $stmt = $conn->prepare("DELETE FROM clients WHERE id = ?");
    $stmt->bind_param('i', $client_id);
    $stmt->execute();
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Client deleted']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Client not found']);
    }
    $stmt->close();
    break;

// REPLACE WITH:
case 'PUT':
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['client_id']) || empty($data['name'])) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'client_id and name are required']);
        exit;
    }
    $client_id = (int) $data['client_id'];
    $name      = trim($data['name']);
    $phone     = trim($data['phone'] ?? '');
    $address   = trim($data['address'] ?? '');
    $gst       = trim($data['gst'] ?? '');
    $stmt = $conn->prepare("UPDATE clients SET name=?, phone=?, address=?, gst=? WHERE id=?");
    $stmt->bind_param('ssssi', $name, $phone, $address, $gst, $client_id);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $stmt->error]);
        exit;
    }
    echo json_encode(['success' => true, 'message' => 'Client updated']);
    $stmt->close();
    break;

case 'DELETE':
    $client_id = (int) ($_GET['client_id'] ?? 0);
    if (!$client_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'client_id required']);
        exit;
    }
    $stmt = $conn->prepare("DELETE FROM client_payments WHERE client_id = ?");
    $stmt->bind_param('i', $client_id);
    $stmt->execute();
    $stmt->close();
    $stmt = $conn->prepare("DELETE FROM clients WHERE id = ?");
    $stmt->bind_param('i', $client_id);
    $stmt->execute();
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Client deleted']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Client not found']);
    }
    $stmt->close();
    break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

    $conn->close();