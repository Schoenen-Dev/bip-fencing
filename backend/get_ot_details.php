<?php
ini_set("display_errors", 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

$sql = "SELECT 
          id,
          emp_name,
          emp_id,
          salary_type,
          start_time,
          end_time,
          total_ot_hours,
          ot_date,
          created_at
        FROM ot_details
        ORDER BY id DESC";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        "message" => "Query failed",
        "error" => $conn->error
    ]);
    exit();
}

$records = [];

while ($row = $result->fetch_assoc()) {
    $records[] = $row;
}

echo json_encode($records);

$conn->close();
?>