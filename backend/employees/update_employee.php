<?php
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$id = (int)($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Employee ID required']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$name    = trim($body['employee_name'] ?? '');
$empId   = trim($body['emp_id'] ?? '');
$dept    = trim($body['department'] ?? '');
$dest    = isset($body['destination']) ? trim($body['destination']) : null;
$gender  = isset($body['gender']) && in_array($body['gender'], ['Male', 'Female', 'Other']) ? $body['gender'] : null;
$email   = isset($body['email']) ? trim($body['email']) : null;
$phone   = isset($body['phone_number']) ? trim($body['phone_number']) : null;
$address = isset($body['address']) ? trim($body['address']) : null;
$salType = trim($body['salary_type'] ?? '');
$doj     = trim($body['date_of_joining'] ?? '');

if (!$name || !$empId || !$dept || !$salType || !$doj) {
    http_response_code(422);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$db = getDB();

// Permission check: admin can edit any; branch users only their branch
if ($authUser['role'] !== 'admin') {
    $check = $db->prepare("SELECT id FROM employees WHERE id = ? AND branch_id = ?");
    $check->bind_param('ii', $id, $authUser['branch_id']);
    $check->execute();
    if (!$check->get_result()->fetch_assoc()) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
}

$stmt = $db->prepare("
    UPDATE employees SET 
        employee_name=?, emp_id=?, department=?, destination=?, gender=?, email=?, phone_number=?, address=?, salary_type=?, date_of_joining=?
    WHERE id=?
");
$stmt->bind_param(
    'ssssssssssi',
    $name, $empId, $dept, $dest, $gender, $email, $phone, $address, $salType, $doj, $id
);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Employee updated']);
} else {
    http_response_code(500);
    echo json_encode(['error' => $stmt->error]);
}
$stmt->close();
$db->close();
?>