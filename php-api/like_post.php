<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

$postId = $_POST['post_id'] ?? '';
$action = $_POST['action'] ?? 'like'; // like 或 unlike

if (empty($postId)) {
    echo json_encode(['code'=>1,'msg'=>'参数缺失']);exit;
}

$file = dirname(__DIR__)."/data/posts/likes_".$postId.".json";
$likes = getJsonFile($file);

// 使用 IP + 简单标识来识别用户
$userId = md5($_SERVER['REMOTE_ADDR'] . '_user');

$isLiked = false;
foreach ($likes as $key => $like) {
    if ($like['user_id'] === $userId) {
        $isLiked = true;
        if ($action === 'unlike') {
            unset($likes[$key]);
            $likes = array_values($likes);
        }
        break;
    }
}

if ($action === 'like' && !$isLiked) {
    $likes[] = [
        'user_id' => $userId,
        'time' => date('Y-m-d H:i:s')
    ];
}

saveJsonFile($file, $likes);
$count = count($likes);

echo json_encode([
    'code'=>0,
    'msg'=>$action === 'like' ? '点赞成功' : '取消点赞',
    'count'=>$count,
    'liked'=>$action === 'like'
], JSON_UNESCAPED_UNICODE);
?>
