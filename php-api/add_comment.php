<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

$postId = $_POST['post_id'] ?? '';
$content = $_POST['content'] ?? '';
$username = $_POST['username'] ?? '匿名吃瓜用户';
$parentId = $_POST['parent_id'] ?? null; // 父评论ID，用于多级评论
$replyTo = $_POST['reply_to'] ?? null; // 回复给哪个用户

if(empty($postId) || empty($content)){
    echo json_encode(['code'=>1,'msg'=>'参数缺失']);exit;
}

$file = dirname(__DIR__)."/data/comments/cmt_".$postId.".json";
$list = getJsonFile($file);

$newComment = [
    'id' => genId(),
    'post_id' => $postId,
    'username' => $username,
    'content' => $content,
    'time' => date('Y-m-d H:i:s'),
    'parent_id' => $parentId,
    'reply_to' => $replyTo,
    'like_count' => 0,
    'is_top' => false
];

$list[] = $newComment;

saveJsonFile($file, $list);
echo json_encode(['code'=>0,'msg'=>'评论发布成功', 'data'=>$newComment], JSON_UNESCAPED_UNICODE);
?>
