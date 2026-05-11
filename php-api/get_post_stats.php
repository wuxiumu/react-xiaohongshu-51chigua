<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

$postId = $_GET['post_id'] ?? '';

if (empty($postId)) {
    echo json_encode(['code'=>1,'msg'=>'参数缺失']);exit;
}

// 获取点赞数
$likesFile = dirname(__DIR__)."/data/posts/likes_".$postId.".json";
$likes = getJsonFile($likesFile);
$likeCount = count($likes);

// 检查当前用户是否点赞
$userId = md5($_SERVER['REMOTE_ADDR'] . '_user');
$isLiked = false;
foreach ($likes as $like) {
    if ($like['user_id'] === $userId) {
        $isLiked = true;
        break;
    }
}

// 获取分享数
$sharesFile = dirname(__DIR__)."/data/posts/shares_".$postId.".json";
$shares = getJsonFile($sharesFile);
$shareCount = count($shares);

// 获取评论数
$commentsFile = dirname(__DIR__)."/data/comments/cmt_".$postId.".json";
$comments = getJsonFile($commentsFile);
$commentCount = count($comments);

echo json_encode([
    'code'=>0,
    'post_id'=>$postId,
    'like_count'=>$likeCount,
    'share_count'=>$shareCount,
    'comment_count'=>$commentCount,
    'is_liked'=>$isLiked
], JSON_UNESCAPED_UNICODE);
?>
