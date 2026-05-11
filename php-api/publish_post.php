<?php
// 必须在任何输出之前设置上传限制
ini_set('upload_max_filesize', '20M');
ini_set('post_max_size', '20M');
ini_set('max_execution_time', '300');
ini_set('max_input_time', '300');
ini_set('memory_limit', '256M');

header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';
require_once 'config.php';

// 管理员邮箱
$adminEmail = 'chigua517@outlook.com';

// 发布限制配置
define('MAX_TOTAL_POSTS', 200);        // 全站最多帖子数
define('MAX_DAILY_POSTS_PER_IP', 2);  // 每个用户每天最多发布数

// 获取客户端 IP
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// 确保 posts 目录存在
$postsDir = dirname(__DIR__) . '/data/posts/';
if (!is_dir($postsDir)) {
    mkdir($postsDir, 0777, true);
}

// ---- 检查全站帖子总数限制 ----
$imgDir = dirname(__DIR__) . '/data/img/';
$totalPosts = 0;
if (is_dir($imgDir)) {
    $allFiles = array_diff(scandir($imgDir), ['.', '..']);
    $totalPosts = count($allFiles);
}

if ($totalPosts >= MAX_TOTAL_POSTS) {
    echo json_encode([
        'code' => 1,
        'msg' => '全站图片已达上限（' . MAX_TOTAL_POSTS . '条），暂时无法发布。请联系管理员：<a href="mailto:' . $adminEmail . '">' . $adminEmail . '</a>'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ---- 检查每日每IP发帖限制 ----
$dailyLogFile = $postsDir . 'daily_' . date('Ymd') . '.json';
$dailyData = getJsonFile($dailyLogFile);

// 统计当前 IP 今日发帖数
$ipTodayPosts = 0;
if (is_array($dailyData)) {
    foreach ($dailyData as $entry) {
        if (isset($entry['ip']) && $entry['ip'] === $clientIp) {
            $ipTodayPosts++;
        }
    }
}

if ($ipTodayPosts >= MAX_DAILY_POSTS_PER_IP) {
    echo json_encode([
        'code' => 1,
        'msg' => '您今天的发帖数已达上限（' . MAX_DAILY_POSTS_PER_IP . '条），请明天再试。如需更多请联系管理员：<a href="mailto:' . $adminEmail . '">' . $adminEmail . '</a>'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 定义上传限制（15MB）
define('UPLOAD_MAX_SIZE', 15 * 1024 * 1024);
define('UPLOAD_ALLOWED_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// 检查是否有文件上传
if (!isset($_FILES['image'])) {
    echo json_encode(['code'=>1, 'msg'=>'请选择图片']);exit;
}

$image = $_FILES['image'];

// 检查上传错误
if ($image['error'] !== UPLOAD_ERR_OK) {
    $errorMsg = '上传失败';
    switch ($image['error']) {
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            $errorMsg = '图片大小超过服务器限制';
            break;
        case UPLOAD_ERR_PARTIAL:
            $errorMsg = '图片上传不完整';
            break;
        case UPLOAD_ERR_NO_FILE:
            $errorMsg = '请选择图片';
            break;
    }
    echo json_encode(['code'=>1, 'msg'=>$errorMsg]);exit;
}

// 检查文件大小
if ($image['size'] > UPLOAD_MAX_SIZE) {
    echo json_encode(['code'=>1, 'msg'=>'图片大小不能超过15MB']);exit;
}

// 检查文件类型
$ext = strtolower(pathinfo($image['name'], PATHINFO_EXTENSION));
if (!in_array($ext, UPLOAD_ALLOWED_TYPES)) {
    echo json_encode(['code'=>1, 'msg'=>'只支持 ' . implode(', ', UPLOAD_ALLOWED_TYPES) . ' 格式']);exit;
}

// 确保图片目录存在
$imgDir = dirname(__DIR__) . '/data/img/';
if (!is_dir($imgDir)) {
    mkdir($imgDir, 0777, true);
}

// 生成文件名
$filename = 'user_' . date('YmdHis') . '_' . mt_rand(1000, 9999) . '.' . $ext;
$uploadPath = $imgDir . $filename;

// 移动文件
if (!move_uploaded_file($image['tmp_name'], $uploadPath)) {
    echo json_encode(['code'=>1, 'msg'=>'保存图片失败']);exit;
}

// 生成帖子ID
$postId = md5('data/img/' . $filename);

// 保存帖子信息
$title = $_POST['title'] ?? '未命名图片';
$desc = $_POST['desc'] ?? '用户上传的图片';
$username = $_POST['username'] ?? '匿名用户';

$post = [
    'id' => $postId,
    'img' => 'data/img/' . $filename,
    'title' => $title,
    'desc' => $desc,
    'username' => $username,
    'create_time' => date('Y-m-d H:i:s'),
    'like_count' => 0,
    'share_count' => 0,
    'comment_count' => 0,
    'is_user_upload' => true
];

// 保存到帖子文件
$postFile = $postsDir . 'user_' . $postId . '.json';
file_put_contents($postFile, json_encode($post, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));

// 记录今日发帖日志（用于限制检查）
$dailyData[] = [
    'ip' => $clientIp,
    'post_id' => $postId,
    'time' => date('Y-m-d H:i:s')
];
saveJsonFile($dailyLogFile, $dailyData);

// 返回成功
echo json_encode([
    'code' => 0,
    'msg' => '发布成功！',
    'data' => $post
], JSON_UNESCAPED_UNICODE);
?>
