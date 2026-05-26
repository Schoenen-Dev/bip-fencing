<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "/db.php";

$sql = "SELECT * FROM branch_amounts ORDER BY id ASC";
$result = $conn->query($sql);

$records = [];

while ($row = $result->fetch_assoc()) {
    $records[] = $row;
}

echo json_encode($records);

$conn->close();
?>