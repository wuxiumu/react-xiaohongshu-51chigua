<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

$postId = $_GET['post_id'] ?? '';
$file = dirname(__DIR__)."/data/comments/cmt_".$postId.".json";
$list = getJsonFile($file);

// 构建评论树结构
function buildCommentTree($comments, $parentId = null) {
    $tree = [];
    foreach ($comments as $comment) {
        $commentParentId = $comment['parent_id'] ?? null;
        if ($commentParentId === $parentId || ($parentId === null && $commentParentId === null)) {
            $children = buildCommentTree($comments, $comment['id']);
            if (!empty($children)) {
                $comment['children'] = $children;
            }
            $tree[] = $comment;
        }
    }
    return $tree;
}

// 按时间排序（最新的在前面）
usort($list, function($a, $b) {
    return strtotime($b['time']) - strtotime($a['time']);
});

// 构建树形结构
$tree = buildCommentTree($list);

// 统计评论总数
$totalCount = count($list);

// 统计一级评论数
$rootCount = 0;
foreach ($list as $item) {
    $parentId = $item['parent_id'] ?? null;
    if ($parentId === null) {
        $rootCount++;
    }
}

echo json_encode([
    'code'=>0,
    'list'=>$tree,
    'total_count'=>$totalCount,
    'root_count'=>$rootCount
], JSON_UNESCAPED_UNICODE);
?>
