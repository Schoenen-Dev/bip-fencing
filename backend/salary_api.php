<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once "db.php";

$action = $_GET['action'] ?? '';

/*
|--------------------------------------------------------------------------
| 1. Get Employee List  →  salary_api.php?action=employees
|    Reads: employees.emp_id, employees.employee_name
|--------------------------------------------------------------------------
*/
if ($action === "employees") {

    $result = $conn->query("
        SELECT emp_id, employee_name AS emp_name
        FROM employees
        ORDER BY employee_name
    ");

    $employees = [];
    while ($row = $result->fetch_assoc()) {
        $employees[] = $row;
    }

    echo json_encode($employees);
    exit();
}

/*
|--------------------------------------------------------------------------
| 2. Get Salary Records  →  salary_api.php?action=records
|    Reads: salaries table (all columns)
|--------------------------------------------------------------------------
*/
if ($action === "records") {

    $result = $conn->query("
        SELECT
            id,
            employeeName,
            employeeId,
            salary,
            paid,
            balance,
            type,
            salary_date,
            created_at
        FROM salaries
        ORDER BY id DESC
    ");

    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }

    echo json_encode($records);
    exit();
}

/*
|--------------------------------------------------------------------------
| 3. Save Salary  →  salary_api.php?action=save  (POST JSON body)
|    Inserts into: salaries table
|--------------------------------------------------------------------------
*/
if ($action === "save") {

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["success" => false, "message" => "No Data Received"]);
        exit();
    }

    $employeeName = $conn->real_escape_string($data['employeeName'] ?? '');
    $employeeId   = $conn->real_escape_string($data['employeeId']   ?? '');
    $salary       = floatval($data['salary']  ?? 0);
    $paid         = floatval($data['paid']    ?? 0);
    $balance      = floatval($data['balance'] ?? 0);
    $type         = $conn->real_escape_string($data['type'] ?? '');
    $date         = $conn->real_escape_string($data['date'] ?? '');

    $stmt = $conn->prepare("
        INSERT INTO salaries
            (employeeName, employeeId, salary, paid, balance, type, salary_date)
        VALUES
            (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "ssdddss",
        $employeeName,
        $employeeId,
        $salary,
        $paid,
        $balance,
        $type,
        $date
    );

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Salary Saved Successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => $stmt->error]);
    }

    $stmt->close();
    exit();
}

echo json_encode(["success" => false, "message" => "Invalid Action"]);