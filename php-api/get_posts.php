<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

$posts = getPostsList();

echo json_encode(['code'=>0,'list'=>$posts], JSON_UNESCAPED_UNICODE);
?>
