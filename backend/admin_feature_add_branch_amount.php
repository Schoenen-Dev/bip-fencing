<?php
header("Access-Control-Allow-Origin: http://localhost:8000");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include __DIR__ . "/../backend/db.php";

$data = json_decode(file_get_contents("php://input"), true);

$branch_name = $data["branch_name"] ?? "";
$amount = $data["amount"] ?? "";
$payment_date = $data["payment_date"] ?? "";
$note = $data["note"] ?? "";

if (empty($branch_name) || $amount === "" || empty($payment_date)) {
    http_response_code(400);
    echo json_encode(["message" => "Branch name, amount and date are required"]);
    exit();
}

$sql = "INSERT INTO branch_amounts 
        (branch_name, amount, payment_date, note)
        VALUES (?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "message" => "Prepare failed",
        "error" => $conn->error
    ]);
    exit();
}

$stmt->bind_param("sdss", $branch_name, $amount, $payment_date, $note);

if ($stmt->execute()) {
    echo json_encode(["message" => "Branch amount saved successfully"]);
} else {
    http_response_code(500);
    echo json_encode([
        "message" => "Execute failed",
        "error" => $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>