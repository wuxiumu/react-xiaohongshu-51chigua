<?php
/**
 * 环境配置文件
 * 根据部署环境修改此文件
 */

// 设置 PHP 上传限制（必须在其他代码之前）
ini_set('upload_max_filesize', '20M');
ini_set('post_max_size', '20M');
ini_set('max_execution_time', '300');
ini_set('max_input_time', '300');
ini_set('memory_limit', '256M');

// 数据库配置（目前使用文件存储，预留配置）
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'xiaohongshu');

// 上传配置（注意：这里的值要小于等于上面的 ini_set 值）
define('UPLOAD_MAX_SIZE', 15 * 1024 * 1024); // 15MB，留一些余量
define('UPLOAD_ALLOWED_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// 分页配置
define('PAGE_SIZE', 12);
define('MAX_COMMENT_LENGTH', 500);

// 匿名配置
define('ALLOW_ANONYMOUS', true);
define('RANDOM_NICKNAME_FILE', __DIR__ . '/../data/nickname.md');

// 调试模式
define('DEBUG_MODE', false);

// 时区设置
date_default_timezone_set('Asia/Shanghai');

// 错误处理
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

/**
 * 获取基础 URL
 */
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $protocol . '://' . $host;
}

/**
 * 获取数据目录路径
 */
function getDataPath() {
    return dirname(__DIR__) . '/data/';
}

/**
 * 获取图片目录路径
 */
function getImgPath() {
    return getDataPath() . 'img/';
}

/**
 * 获取评论文件路径
 */
function getCommentFile($postId) {
    return getDataPath() . 'comments/cmt_' . $postId . '.json';
}

/**
 * 获取帖子统计文件路径
 */
function getPostStatsFile($postId) {
    return getDataPath() . 'posts/stats_' . $postId . '.json';
}
