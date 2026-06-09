<?php
// ============================================================
//  quotation_api.php  –  Unified Quotation API
//
//  Handles all CRUD operations for quotations via HTTP method:
//    GET    → Fetch all quotations (get_quotations)
//    POST   → Add a new quotation  (add_quotation)
//    PUT    → Update a quotation   (update_quotation)
//    DELETE → Delete a quotation   (delete_quotation)
//
//  Usage examples:
//    GET    /quotation_api.php
//    POST   /quotation_api.php          (JSON body)
//    PUT    /quotation_api.php          (JSON body with 'id')
//    DELETE /quotation_api.php?id=123
// ============================================================

error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

// ------------------------------------------------------------
//  SHARED HELPER: Resolve effective branch ID for the user
//  - Admin viewing a specific branch → use that branch
//  - Non-admin → use their own branch
//  - Admin with no branch selected → return null (all branches)
// ------------------------------------------------------------
function getEffectiveBranchId(array $user): ?int {
    if ($user['role'] === 'admin' && isset($user['view_branch_id']) && $user['view_branch_id'] !== null) {
        return (int) $user['view_branch_id'];
    }
    if ($user['role'] !== 'admin' && isset($user['branch_id']) && $user['branch_id'] !== null) {
        return (int) $user['branch_id'];
    }
    return null;
}

// ------------------------------------------------------------
//  SHARED HELPER: Branch-level permission check for a record
//  Returns true if the quotation belongs to the user's branch,
//  or if the user is a super-admin with no branch restriction.
// ------------------------------------------------------------
function checkBranchAccess(mysqli $conn, array $authUser, int $id): bool {
    $branchCheck = $authUser['role'] === 'admin' && isset($authUser['view_branch_id']) && $authUser['view_branch_id'] !== null
        ? $authUser['view_branch_id']
        : ($authUser['role'] !== 'admin' ? $authUser['branch_id'] : null);

    if ($branchCheck === null) {
        return true; // Super-admin, no restriction
    }

    $chk = $conn->prepare("SELECT id FROM quotations WHERE id = ? AND branch_id = ?");
    $chk->bind_param('ii', $id, $branchCheck);
    $chk->execute();
    $found = (bool) $chk->get_result()->fetch_assoc();
    $chk->close();
    return $found;
}

// ============================================================
//  ROUTE: Dispatch to the correct handler by HTTP method
// ============================================================
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ----------------------------------------------------------
    //  GET  –  Fetch single quotation (?id=) or all quotations
    // ----------------------------------------------------------
    case 'GET':
        if (!empty($_GET['id'])) {
            handleGetSingleQuotation();
        } else {
            handleGetQuotations();
        }
        break;

    // ----------------------------------------------------------
    //  POST  –  Add a new quotation
    // ----------------------------------------------------------
    case 'POST':
        handleAddQuotation();
        break;

    // ----------------------------------------------------------
    //  PUT  –  Update an existing quotation
    // ----------------------------------------------------------
    case 'PUT':
        handleUpdateQuotation();
        break;

    // ----------------------------------------------------------
    //  DELETE  –  Delete a quotation by ?id=
    // ----------------------------------------------------------
    case 'DELETE':
        handleDeleteQuotation();
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        exit;
}


// ============================================================
//  HANDLER: GET (?id=) – Retrieve a single quotation with items
// ============================================================
function handleGetSingleQuotation(): void {
    global $authUser;

    $id   = (int) ($_GET['id'] ?? 0);
    $conn = getDB();

    // Branch-level permission check
    if (!checkBranchAccess($conn, $authUser, $id)) {
        http_response_code(403);
        echo json_encode(['message' => 'Access denied']);
        exit;
    }

    // Fetch quotation header
    $stmt = $conn->prepare("SELECT * FROM quotations WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $data = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$data) {
        http_response_code(404);
        echo json_encode(['message' => 'Quotation not found']);
        exit;
    }

    // Fetch line items for this quotation
    $iStmt = $conn->prepare("SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC");
    $iStmt->bind_param('i', $id);
    $iStmt->execute();
    $itemsResult = $iStmt->get_result();
    $items = [];
    while ($row = $itemsResult->fetch_assoc()) {
        $items[] = $row;
    }
    $iStmt->close();

    $data['items'] = $items;
    echo json_encode($data);
    $conn->close();
}

// ============================================================
//  HANDLER: GET – Retrieve all quotations for the branch
// ============================================================
function handleGetQuotations(): void {
    global $authUser;

    $branchId = getEffectiveBranchId($authUser);
    $conn     = getDB();

    // Fetch quotations filtered by branch (or all for super-admin)
    if ($branchId !== null) {
        $stmt = $conn->prepare("
            SELECT q.*,
                (SELECT COUNT(*)       FROM quotation_items WHERE quotation_id = q.id) AS items_count,
                (SELECT SUM(quantity * rate) FROM quotation_items WHERE quotation_id = q.id) AS subtotal
            FROM quotations q
            WHERE q.branch_id = ?
            ORDER BY q.id DESC
        ");
        $stmt->bind_param('i', $branchId);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query("
            SELECT q.*,
                (SELECT COUNT(*)       FROM quotation_items WHERE quotation_id = q.id) AS items_count,
                (SELECT SUM(quantity * rate) FROM quotation_items WHERE quotation_id = q.id) AS subtotal
            FROM quotations q
            ORDER BY q.id DESC
        ");
    }

    // Calculate discount, tax, and grand total for each row
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $subtotal    = (float) $row['subtotal'];
        $discountAmt = $subtotal * $row['discount_percent'] / 100;
        $taxable     = $subtotal - $discountAmt;
        $taxAmt      = $taxable  * $row['tax_percent']      / 100;
        $grandTotal  = $taxable  + $taxAmt;

        $row['discount_amount'] = $discountAmt;
        $row['tax_amount']      = $taxAmt;
        $row['grand_total']     = $grandTotal;
        $rows[] = $row;
    }

    echo json_encode($rows);
    $conn->close();
}


// ============================================================
//  HANDLER: POST – Add a new quotation + its line items
// ============================================================
function handleAddQuotation(): void {
    global $authUser;

    // Parse JSON body
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON data']);
        exit;
    }

    // Resolve and validate branch
    $branchId = getEffectiveBranchId($authUser);
    if ($branchId === null) {
        http_response_code(400);
        echo json_encode(['message' => 'No branch selected. Please select a branch from the topbar.']);
        exit;
    }

    // Collect header fields
    $quote_no           = trim($data['quoteNo']           ?? '');
    $quote_date         = trim($data['quoteDate']         ?? '');
    $valid_until        = trim($data['validUntil']        ?? '');
    $po_no              = trim($data['poNo']              ?? '');
    $dispatched_through = trim($data['dispatchedThrough'] ?? '');
    $vehicle_no         = trim($data['vehicleNo']         ?? '');
    $other_ref          = trim($data['otherRef']          ?? '');
    $client_name        = trim($data['clientName']        ?? '');
    $client_phone       = trim($data['clientPhone']       ?? '');
    $client_email       = trim($data['clientEmail']       ?? '');
    $client_gst         = trim($data['clientGst']         ?? '');
    $client_address     = trim($data['clientAddress']     ?? '');
    $ship_name          = trim($data['shipName']          ?? '');
    $ship_address       = trim($data['shipAddress']       ?? '');
    $ship_gst           = trim($data['shipGst']           ?? '');
    $ship_state         = trim($data['shipState']         ?? '');
    $ship_state_code    = trim($data['shipStateCode']     ?? '');
    $discount           = (float) ($data['discount']      ?? 0);
    $tax_percent        = (float) ($data['taxPercent']    ?? 18);
    $notes              = trim($data['notes']             ?? '');
    $declaration        = trim($data['declaration']       ?? '');
    $items              = $data['items']                  ?? [];

    // Validate required fields
    if (empty($quote_no) || empty($quote_date) || empty($client_name) || empty($items)) {
        http_response_code(400);
        echo json_encode(['message' => 'Quote number, date, client name and at least one item are required']);
        exit;
    }

    $conn = getDB();

    // Check for duplicate quote number within the same branch
    $check = $conn->prepare("SELECT id FROM quotations WHERE quote_no = ? AND branch_id = ?");
    $check->bind_param('si', $quote_no, $branchId);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['message' => 'Quote number already exists for this branch']);
        exit;
    }
    $check->close();

    // Insert quotation header record
    $stmt = $conn->prepare("
        INSERT INTO quotations
        (quote_no, quote_date, valid_until, po_no, dispatched_through, vehicle_no, other_ref,
         client_name, client_phone, client_email, client_gst, client_address,
         ship_name, ship_address, ship_gst, ship_state, ship_state_code,
         discount_percent, tax_percent, notes, declaration, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('sssssssssssssssssddsis',
        $quote_no, $quote_date, $valid_until, $po_no, $dispatched_through, $vehicle_no, $other_ref,
        $client_name, $client_phone, $client_email, $client_gst, $client_address,
        $ship_name, $ship_address, $ship_gst, $ship_state, $ship_state_code,
        $discount, $tax_percent, $notes, $declaration, $branchId
    );
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to insert quotation: ' . $stmt->error]);
        exit;
    }
    $quotation_id = $conn->insert_id;
    $stmt->close();

    // Insert each line item
    insertItems($conn, $quotation_id, $items);

    echo json_encode(['message' => 'Quotation saved successfully', 'id' => $quotation_id]);
    $conn->close();
}


// ============================================================
//  HANDLER: PUT – Update an existing quotation
// ============================================================
function handleUpdateQuotation(): void {
    global $authUser;

    // Parse JSON body
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid data or missing ID']);
        exit;
    }

    $id   = (int) $data['id'];
    $conn = getDB();

    // Branch-level permission check
    if (!checkBranchAccess($conn, $authUser, $id)) {
        http_response_code(403);
        echo json_encode(['message' => 'Access denied']);
        exit;
    }

    // Collect updated header fields
    $quote_no           = trim($data['quoteNo']           ?? '');
    $quote_date         = trim($data['quoteDate']         ?? '');
    $valid_until        = trim($data['validUntil']        ?? '');
    $po_no              = trim($data['poNo']              ?? '');
    $dispatched_through = trim($data['dispatchedThrough'] ?? '');
    $vehicle_no         = trim($data['vehicleNo']         ?? '');
    $other_ref          = trim($data['otherRef']          ?? '');
    $client_name        = trim($data['clientName']        ?? '');
    $client_phone       = trim($data['clientPhone']       ?? '');
    $client_email       = trim($data['clientEmail']       ?? '');
    $client_gst         = trim($data['clientGst']         ?? '');
    $client_address     = trim($data['clientAddress']     ?? '');
    $ship_name          = trim($data['shipName']          ?? '');
    $ship_address       = trim($data['shipAddress']       ?? '');
    $ship_gst           = trim($data['shipGst']           ?? '');
    $ship_state         = trim($data['shipState']         ?? '');
    $ship_state_code    = trim($data['shipStateCode']     ?? '');
    $discount           = (float) ($data['discount']      ?? 0);
    $tax_percent        = (float) ($data['taxPercent']    ?? 18);
    $notes              = trim($data['notes']             ?? '');
    $declaration        = trim($data['declaration']       ?? '');
    $items              = $data['items']                  ?? [];

    // Validate required fields
    if (empty($quote_no) || empty($quote_date) || empty($client_name) || empty($items)) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing required fields']);
        exit;
    }

    // Update quotation header record
    $stmt = $conn->prepare("
        UPDATE quotations SET
            quote_no=?, quote_date=?, valid_until=?, po_no=?, dispatched_through=?, vehicle_no=?, other_ref=?,
            client_name=?, client_phone=?, client_email=?, client_gst=?, client_address=?,
            ship_name=?, ship_address=?, ship_gst=?, ship_state=?, ship_state_code=?,
            discount_percent=?, tax_percent=?, notes=?, declaration=?
        WHERE id=?
    ");
    $stmt->bind_param('sssssssssssssssssddssi',
        $quote_no, $quote_date, $valid_until, $po_no, $dispatched_through, $vehicle_no, $other_ref,
        $client_name, $client_phone, $client_email, $client_gst, $client_address,
        $ship_name, $ship_address, $ship_gst, $ship_state, $ship_state_code,
        $discount, $tax_percent, $notes, $declaration, $id
    );
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['message' => 'Update failed: ' . $stmt->error]);
        exit;
    }
    $stmt->close();

    // Replace all line items: delete old ones, insert new ones
    $conn->query("DELETE FROM quotation_items WHERE quotation_id = $id");
    insertItems($conn, $id, $items);

    echo json_encode(['message' => 'Quotation updated successfully']);
    $conn->close();
}


// ============================================================
//  HANDLER: DELETE – Remove a quotation by ?id=
// ============================================================
function handleDeleteQuotation(): void {
    global $authUser;

    // Validate the ID query param
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['message' => 'Quotation ID required']);
        exit;
    }

    $conn = getDB();

    // Branch-level permission check
    if (!checkBranchAccess($conn, $authUser, $id)) {
        http_response_code(403);
        echo json_encode(['message' => 'Access denied']);
        exit;
    }

    // Delete the quotation record (cascade deletes items if FK set, else handle separately)
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
}


// ============================================================
//  SHARED HELPER: Insert line items for a quotation
//  Used by both handleAddQuotation() and handleUpdateQuotation()
// ============================================================
function insertItems(mysqli $conn, int $quotation_id, array $items): void {
    $itemStmt = $conn->prepare("
        INSERT INTO quotation_items
        (quotation_id, description, hsn, due_on, unit, quantity, rate, amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($items as $item) {
        $desc = trim($item['description'] ?? '');
        $hsn  = trim($item['hsn']         ?? '');
        $due  = trim($item['dueOn']       ?? '') ?: null;
        $unit = trim($item['unit']        ?? 'Nos');
        $qty  = (float) ($item['qty']     ?? 0);
        $rate = (float) ($item['rate']    ?? 0);
        $amt  = $qty * $rate;

        // Only insert items that have a description and a positive quantity
        if ($desc && $qty > 0) {
            $itemStmt->bind_param('issssddd', $quotation_id, $desc, $hsn, $due, $unit, $qty, $rate, $amt);
            $itemStmt->execute();
        }
    }

    $itemStmt->close();
}