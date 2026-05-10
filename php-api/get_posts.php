<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

$imgList = getImgList();
$posts = [];

foreach($imgList as $idx=>$img){
    // 使用文件名的哈希作为固定ID，确保服务器重启后ID不变
    $fixedId = md5($img);
    $posts[] = [
        'id' => $fixedId,
        'img' => $img,
        'title' => '吃瓜美女图集'.($idx+1),
        'desc' => '高清美女吃瓜日常点评',
        'create_time' => date('Y-m-d H:i:s', filemtime(dirname(__DIR__) . '/' . $img))
    ];
}

echo json_encode(['code'=>0,'list'=>$posts], JSON_UNESCAPED_UNICODE);
?>
