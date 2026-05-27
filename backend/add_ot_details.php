<?php
ini_set("display_errors", 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include "db.php";

if (!isset($conn)) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection variable conn not found"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid JSON data"]);
    exit();
}

$emp_name = $data["emp_name"] ?? "";
$emp_id = $data["emp_id"] ?? "";
$salary_type = $data["salary_type"] ?? "";
$start_time = $data["start_time"] ?? "";
$end_time = $data["end_time"] ?? "";
$total_ot_hours = $data["total_ot_hours"] ?? "";
$ot_date = $data["ot_date"] ?? "";

if (
    empty($emp_name) ||
    empty($emp_id) ||
    empty($salary_type) ||
    empty($start_time) ||
    empty($end_time) ||
    $total_ot_hours === "" ||
    empty($ot_date)
) {
    http_response_code(400);
    echo json_encode(["message" => "All fields are required"]);
    exit();
}

$sql = "INSERT INTO ot_details 
        (emp_name, emp_id, salary_type, start_time, end_time, total_ot_hours, ot_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "message" => "Prepare failed",
        "error" => $conn->error
    ]);
    exit();
}

$stmt->bind_param(
    "sssssss",
    $emp_name,
    $emp_id,
    $salary_type,
    $start_time,
    $end_time,
    $total_ot_hours,
    $ot_date
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "message" => "Execute failed",
        "error" => $stmt->error
    ]);
    exit();
}

echo json_encode(["message" => "OT details saved successfully"]);

$stmt->close();
$conn->close();
?>