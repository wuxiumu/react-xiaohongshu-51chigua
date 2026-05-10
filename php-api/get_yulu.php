<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

$filePath = dirname(__DIR__) . '/data/yulu.md';
$content = file_exists($filePath) ? file_get_contents($filePath) : '';
$lines = array_filter(array_map('trim', explode("\n", $content)));
$quotes = array_values(array_filter($lines, function($line) {
    return !empty($line) && strpos($line, '#') !== 0;
}));

$total = count($quotes);

echo json_encode([
    'code' => 0,
    'total' => $total,
    'quotes' => $quotes
], JSON_UNESCAPED_UNICODE);
?>
