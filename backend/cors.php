<?php

// JSON by default
if (!defined('HTML_RESPONSE')) {
    header('Content-Type: application/json; charset=utf-8');
}

// Allowed frontend domains
$allowedOrigins = [
    'https://www.bipbilling.co.in',
    'https://bipbilling.co.in',
    'https://bip-fencing.vercel.app',
    'http://localhost:5173'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

// If you use cookies or sessions
header("Access-Control-Allow-Credentials: true");

// Allow methods
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Allow headers
header("Access-Control-Allow-Headers: Authorization, Content-Type, X-Branch-ID");

// Expose headers
header("Access-Control-Expose-Headers: Authorization");

// Cache preflight
header("Access-Control-Max-Age: 86400");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}