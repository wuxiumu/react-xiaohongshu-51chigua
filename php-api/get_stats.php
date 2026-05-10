<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

// 精选图片数 = data/img 中的图片数量
$imgList = getImgList();
$totalPosts = count($imgList);

$dataPath = dirname(__DIR__) . '/data/comments/';
$totalComments = 0;
$allUsers = [];
$todayUsers = [];
$today = date('Y-m-d');

if (is_dir($dataPath)) {
    foreach (scandir($dataPath) as $file) {
        if (strpos($file, 'cmt_') !== 0) continue;
        $comments = getJsonFile($dataPath . $file);
        $totalComments += count($comments);

        foreach ($comments as $c) {
            $name = $c['username'] ?? '';
            if (empty($name)) continue;
            $allUsers[$name] = true;
            $date = substr($c['time'] ?? '', 0, 10);
            if ($date === $today) {
                $todayUsers[$name] = true;
            }
        }
    }
}

echo json_encode([
    'code' => 0,
    'total_posts' => $totalPosts,
    'total_comments' => $totalComments,
    'total_users' => count($allUsers),
    'today_users' => count($todayUsers)
], JSON_UNESCAPED_UNICODE);
?>
