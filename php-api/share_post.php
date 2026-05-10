<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

$postId = $_POST['post_id'] ?? '';

if (empty($postId)) {
    echo json_encode(['code'=>1,'msg'=>'参数缺失']);exit;
}

$file = dirname(__DIR__)."/data/posts/shares_".$postId.".json";
$shares = getJsonFile($file);

// 添加分享记录
$shares[] = [
    'id' => genId(),
    'time' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];

saveJsonFile($file, $shares);
$count = count($shares);

echo json_encode([
    'code'=>0,
    'msg'=>'转发成功',
    'count'=>$count
], JSON_UNESCAPED_UNICODE);
?>
