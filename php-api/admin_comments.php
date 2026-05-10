<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once 'helper.php';
require_once 'admin_auth.php';

// 解析 PUT 请求的表单数据
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    parse_str(file_get_contents('php://input'), $_PUT);
    foreach ($_PUT as $key => $value) {
        $_POST[$key] = $value;
    }
}

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // 获取所有评论
        requireAdmin();
        getAllComments();
        break;
        
    case 'PUT':
        // 更新评论
        requireAdmin();
        updateComment();
        break;
        
    case 'DELETE':
        // 删除评论
        requireAdmin();
        deleteComment();
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['code'=>405, 'msg'=>'请求方法不支持'], JSON_UNESCAPED_UNICODE);
}

/**
 * 获取所有评论（带分页）
 */
function getAllComments() {
    $postId = $_GET['post_id'] ?? '';
    $commentsDir = getDataPath() . 'comments/';

    if (!is_dir($commentsDir)) {
        echo json_encode(['code'=>0, 'list'=>[], 'total'=>0, 'page'=>1, 'page_size'=>20, 'total_pages'=>1], JSON_UNESCAPED_UNICODE);
        return;
    }

    $allComments = [];
    $files = glob($commentsDir . 'cmt_*.json');

    foreach ($files as $file) {
        // 提取 post_id
        preg_match('/cmt_(.+?)\.json$/', basename($file), $matches);
        $pid = $matches[1] ?? '';

        if (!empty($postId) && $postId !== $pid) {
            continue;
        }

        $comments = json_decode(file_get_contents($file), true) ?: [];

        foreach ($comments as $comment) {
            $comment['post_id'] = $pid;
            $allComments[] = $comment;
        }
    }

    // 按时间排序
    usort($allComments, function($a, $b) {
        return strtotime($b['time']) - strtotime($a['time']);
    });

    // 分页参数
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $pageSize = isset($_GET['page_size']) ? intval($_GET['page_size']) : 20;

    if ($page < 1) $page = 1;
    if ($pageSize < 1) $pageSize = 20;
    if ($pageSize > 100) $pageSize = 100;

    $total = count($allComments);
    $totalPages = ceil($total / $pageSize);
    $offset = ($page - 1) * $pageSize;
    $list = array_slice($allComments, $offset, $pageSize);

    echo json_encode([
        'code' => 0,
        'list' => $list,
        'total' => $total,
        'page' => $page,
        'page_size' => $pageSize,
        'total_pages' => max(1, $totalPages)
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * 更新评论
 */
function updateComment() {
    $postId = $_GET['post_id'] ?? '';
    $commentId = $_GET['comment_id'] ?? '';
    $content = $_POST['content'] ?? '';
    
    if (empty($postId) || empty($commentId)) {
        echo json_encode(['code'=>1, 'msg'=>'缺少必要参数'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    if (empty($content)) {
        echo json_encode(['code'=>1, 'msg'=>'评论内容不能为空'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    $file = getDataPath() . 'comments/cmt_' . $postId . '.json';
    
    if (!file_exists($file)) {
        echo json_encode(['code'=>1, 'msg'=>'评论不存在'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    $comments = json_decode(file_get_contents($file), true) ?: [];
    $found = false;
    
    // 递归查找并更新评论
    function updateCommentRecursive(&$comments, $commentId, $content, &$found) {
        foreach ($comments as &$comment) {
            if ($comment['id'] === $commentId) {
                $comment['content'] = $content;
                $comment['update_time'] = date('Y-m-d H:i:s');
                $found = true;
                return true;
            }
            if (isset($comment['children']) && !empty($comment['children'])) {
                if (updateCommentRecursive($comment['children'], $commentId, $content, $found)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    updateCommentRecursive($comments, $commentId, $content, $found);
    
    if (!$found) {
        echo json_encode(['code'=>1, 'msg'=>'评论不存在'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    saveJsonFile($file, $comments);
    echo json_encode(['code'=>0, 'msg'=>'评论更新成功'], JSON_UNESCAPED_UNICODE);
}

/**
 * 删除评论
 */
function deleteComment() {
    $postId = $_GET['post_id'] ?? '';
    $commentId = $_GET['comment_id'] ?? '';
    
    if (empty($postId) || empty($commentId)) {
        echo json_encode(['code'=>1, 'msg'=>'缺少必要参数'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    $file = getDataPath() . 'comments/cmt_' . $postId . '.json';
    
    if (!file_exists($file)) {
        echo json_encode(['code'=>1, 'msg'=>'评论不存在'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    $comments = json_decode(file_get_contents($file), true) ?: [];
    $found = false;
    
    // 递归查找并删除评论
    function deleteCommentRecursive(&$comments, $commentId, &$found) {
        foreach ($comments as $key => &$comment) {
            if ($comment['id'] === $commentId) {
                unset($comments[$key]);
                $comments = array_values($comments);
                $found = true;
                return true;
            }
            if (isset($comment['children']) && !empty($comment['children'])) {
                if (deleteCommentRecursive($comment['children'], $commentId, $found)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    deleteCommentRecursive($comments, $commentId, $found);
    
    if (!$found) {
        echo json_encode(['code'=>1, 'msg'=>'评论不存在'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    saveJsonFile($file, $comments);
    echo json_encode(['code'=>0, 'msg'=>'评论删除成功'], JSON_UNESCAPED_UNICODE);
}
?>
