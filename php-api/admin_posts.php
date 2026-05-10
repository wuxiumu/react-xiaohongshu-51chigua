<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once 'helper.php';
require_once 'admin_auth.php';

// 解析 PUT 请求的表单数据（PHP 不会自动填充 $_POST 对于 PUT 请求）
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
 * 获取所有帖子（带分页）
 */
function getAllPosts() {
    $posts = getPostsList();

    // 合并统计数据
    foreach ($posts as &$post) {
        $id = $post['id'];

        $statsFile = getDataPath() . 'posts/stats_' . $id . '.json';
        $stats = file_exists($statsFile) ? json_decode(file_get_contents($statsFile), true) : [];

        $commentsFile = getDataPath() . 'comments/cmt_' . $id . '.json';
        $comments = file_exists($commentsFile) ? json_decode(file_get_contents($commentsFile), true) : [];

        $post['like_count'] = $stats['like_count'] ?? 0;
        $post['share_count'] = $stats['share_count'] ?? 0;
        $post['comment_count'] = count($comments);

        // 加载编辑历史
        $historyFile = getDataPath() . 'posts/history_' . $id . '.json';
        $post['history'] = file_exists($historyFile) ? json_decode(file_get_contents($historyFile), true) : [];
    }

    // 分页参数
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $pageSize = isset($_GET['page_size']) ? intval($_GET['page_size']) : 20;

    if ($page < 1) $page = 1;
    if ($pageSize < 1) $pageSize = 20;
    if ($pageSize > 100) $pageSize = 100;

    $total = count($posts);
    $totalPages = ceil($total / $pageSize);
    $offset = ($page - 1) * $pageSize;
    $list = array_slice($posts, $offset, $pageSize);

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
 * 更新帖子
 */
function updatePost() {
    $postId = $_GET['id'] ?? '';
    $title = $_POST['title'] ?? '';
    $desc = $_POST['desc'] ?? '';
    $username = $_POST['username'] ?? '';
    $createTime = $_POST['create_time'] ?? '';

    if (empty($postId)) {
        echo json_encode(['code'=>1, 'msg'=>'缺少帖子ID'], JSON_UNESCAPED_UNICODE);
        return;
    }

    // 查找对应的图片
    $imgList = getImgList();
    $found = false;

    foreach ($imgList as $img) {
        if (md5($img) === $postId) {
            // 尝试合并已有的元数据
            $userMeta = loadUserPostsMeta();
            $existing = $userMeta[$img] ?? [];

            // 也读取已有的 user 文件
            $userFile = getDataPath() . 'posts/user_' . $postId . '.json';
            $existingUser = file_exists($userFile) ? json_decode(file_get_contents($userFile), true) : [];

            // 记录编辑历史
            $historyFile = getDataPath() . 'posts/history_' . $postId . '.json';
            $history = file_exists($historyFile) ? json_decode(file_get_contents($historyFile), true) : [];
            $history[] = [
                'time' => date('Y-m-d H:i:s'),
                'title' => $existingUser['title'] ?? $existing['title'] ?? '',
                'desc' => $existingUser['desc'] ?? $existing['desc'] ?? '',
                'username' => $existingUser['username'] ?? $existing['username'] ?? '',
                'create_time' => $existingUser['create_time'] ?? $existing['create_time'] ?? ''
            ];
            // 最多保留 50 条历史
            $history = array_slice($history, -50);
            saveJsonFile($historyFile, $history);

            // 创建/更新帖子元数据文件
            $postFile = getDataPath() . 'posts/meta_' . $postId . '.json';
            $meta = [
                'id' => $postId,
                'img' => $img,
                'title' => $title ?: ($existing['title'] ?? ($existingUser['title'] ?? '')),
                'desc' => $desc ?: ($existing['desc'] ?? ($existingUser['desc'] ?? '')),
                'username' => $username ?: ($existing['username'] ?? ($existingUser['username'] ?? '')),
                'create_time' => $createTime ?: ($existingUser['create_time'] ?? $existing['create_time'] ?? date('Y-m-d H:i:s')),
                'update_time' => date('Y-m-d H:i:s'),
                'like_count' => $existingUser['like_count'] ?? 0,
                'share_count' => $existingUser['share_count'] ?? 0,
                'comment_count' => $existingUser['comment_count'] ?? 0,
                'is_user_upload' => true
            ];
            saveJsonFile($postFile, $meta);
            saveJsonFile($userFile, $meta);
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
        $dataPath . 'posts/user_' . $postId . '.json',
        $dataPath . 'posts/stats_' . $postId . '.json',
        $dataPath . 'posts/history_' . $postId . '.json',
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
