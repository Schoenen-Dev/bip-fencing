<?php

// Do NOT force JSON for HTML pages
if (!defined('HTML_RESPONSE')) {
    header('Content-Type: application/json; charset=utf-8');
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Branch-ID');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
?>