<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

// 读取昵称文件
$nicknameFile = dirname(__DIR__) . '/data/nickname.md';
$nicknames = [];

if (file_exists($nicknameFile)) {
    $content = file_get_contents($nicknameFile);
    // 按行分割
    $lines = explode("\n", $content);
    foreach ($lines as $line) {
        // 跳过标题行和空行
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        // 按顿号分割昵称
        $parts = explode('、', $line);
        foreach ($parts as $part) {
            $part = trim($part);
            if (!empty($part) && strlen($part) >= 2 && strlen($part) <= 20) {
                $nicknames[] = $part;
            }
        }
    }
}

// 去重并随机选择
$nicknames = array_unique($nicknames);

// 如果没有昵称，返回默认值
if (empty($nicknames)) {
    $nicknames = ['吃瓜群众', '匿名用户', '神秘人', '路过打酱油', '热心网友'];
}

// 随机返回一个昵称
$randomNickname = $nicknames[array_rand($nicknames)];

echo json_encode(['code'=>0, 'nickname'=>$randomNickname], JSON_UNESCAPED_UNICODE);
?>
