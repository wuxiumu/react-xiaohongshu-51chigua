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

// 确保 posts 目录存在
$postsDir = dirname(__DIR__) . '/data/posts/';
if (!is_dir($postsDir)) {
    mkdir($postsDir, 0777, true);
}

// 保存到帖子文件
$postFile = $postsDir . 'user_' . $postId . '.json';
file_put_contents($postFile, json_encode($post, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));

// 返回成功
echo json_encode([
    'code' => 0,
    'msg' => '发布成功！',
    'data' => $post
], JSON_UNESCAPED_UNICODE);
?>
