<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once 'helper.php';
require_once 'admin_auth.php';

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // 获取所有帖子（带统计信息）
        requireAdmin();
        getAllPosts();
        break;
        
    case 'PUT':
        // 更新帖子
        requireAdmin();
        updatePost();
        break;
        
    case 'DELETE':
        // 删除帖子
        requireAdmin();
        deletePost();
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['code'=>405, 'msg'=>'请求方法不支持'], JSON_UNESCAPED_UNICODE);
}

/**
 * 获取所有帖子
 */
function getAllPosts() {
    $imgList = getImgList();
    $posts = [];
    
    foreach ($imgList as $img) {
        // 从图片路径提取ID
        $id = md5($img);
        
        // 获取统计数据
        $statsFile = getDataPath() . 'posts/stats_' . $id . '.json';
        $stats = file_exists($statsFile) ? json_decode(file_get_contents($statsFile), true) : [];
        
        // 获取评论数
        $commentsFile = getDataPath() . 'comments/cmt_' . $id . '.json';
        $comments = file_exists($commentsFile) ? json_decode(file_get_contents($commentsFile), true) : [];
        
        $posts[] = [
            'id' => $id,
            'img' => $img,
            'title' => basename($img),
            'desc' => '高清美女吃瓜日常点评',
            'create_time' => date('Y-m-d H:i:s', filemtime(getDataPath() . '/../' . $img)),
            'like_count' => $stats['like_count'] ?? 0,
            'share_count' => $stats['share_count'] ?? 0,
            'comment_count' => count($comments)
        ];
    }
    
    // 按时间排序
    usort($posts, function($a, $b) {
        return strtotime($b['create_time']) - strtotime($a['create_time']);
    });
    
    echo json_encode(['code'=>0, 'list'=>$posts], JSON_UNESCAPED_UNICODE);
}

/**
 * 更新帖子
 */
function updatePost() {
    $postId = $_GET['id'] ?? '';
    $title = $_POST['title'] ?? '';
    $desc = $_POST['desc'] ?? '';
    
    if (empty($postId)) {
        echo json_encode(['code'=>1, 'msg'=>'缺少帖子ID'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    // 查找对应的图片
    $imgList = getImgList();
    $found = false;
    
    foreach ($imgList as $img) {
        if (md5($img) === $postId) {
            // 创建/更新帖子元数据文件
            $postFile = getDataPath() . 'posts/meta_' . $postId . '.json';
            $meta = [
                'id' => $postId,
                'img' => $img,
                'title' => $title,
                'desc' => $desc,
                'update_time' => date('Y-m-d H:i:s')
            ];
            saveJsonFile($postFile, $meta);
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        echo json_encode(['code'=>1, 'msg'=>'帖子不存在'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    echo json_encode(['code'=>0, 'msg'=>'更新成功'], JSON_UNESCAPED_UNICODE);
}

/**
 * 删除帖子
 */
function deletePost() {
    $postId = $_GET['id'] ?? '';
    
    if (empty($postId)) {
        echo json_encode(['code'=>1, 'msg'=>'缺少帖子ID'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    // 查找对应的图片
    $imgList = getImgList();
    $found = false;
    $imgPath = '';
    
    foreach ($imgList as $img) {
        if (md5($img) === $postId) {
            $imgPath = dirname(__DIR__) . '/' . $img;
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        echo json_encode(['code'=>1, 'msg'=>'帖子不存在'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    // 删除图片文件
    if (file_exists($imgPath)) {
        unlink($imgPath);
    }
    
    // 删除相关数据文件
    $dataPath = getDataPath();
    $filesToDelete = [
        $dataPath . 'posts/meta_' . $postId . '.json',
        $dataPath . 'posts/stats_' . $postId . '.json',
        $dataPath . 'comments/cmt_' . $postId . '.json'
    ];
    
    foreach ($filesToDelete as $file) {
        if (file_exists($file)) {
            unlink($file);
        }
    }
    
    echo json_encode(['code'=>0, 'msg'=>'删除成功'], JSON_UNESCAPED_UNICODE);
}
?>
