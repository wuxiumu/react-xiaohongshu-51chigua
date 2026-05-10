<?php
// 引入配置文件
require_once 'config.php';

/**
 * 读取JSON文件
 * @param string $path 文件路径
 * @return array 返回解析后的数组
 */
function getJsonFile($path) {
    if(!file_exists($path)) return [];
    return json_decode(file_get_contents($path), true) ?: [];
}

/**
 * 写入JSON文件
 * @param string $path 文件路径
 * @param array $data 要写入的数据
 * @return bool 写入是否成功
 */
function saveJsonFile($path, $data) {
    // 确保目录存在
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
    return file_put_contents($path, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)) !== false;
}

/**
 * 获取data/img下所有图片
 * @return array 图片路径列表
 */
function getImgList() {
    $imgDir = getImgPath();
    $files = [];
    $allow = UPLOAD_ALLOWED_TYPES;
    
    if (!is_dir($imgDir)) {
        return $files;
    }
    
    foreach(scandir($imgDir) as $f){
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if(in_array($ext, $allow)){
            // 将反斜杠替换为正斜杠
            $path = str_replace('\\', '/', 'data/img/'.$f);
            $files[] = $path;
        }
    }
    return $files;
}

/**
 * 生成唯一ID
 * @return string 唯一ID
 */
function genId(){
    return date('YmdHis') . mt_rand(100, 999);
}

/**
 * 获取随机昵称
 * @return string 随机昵称
 */
function getRandomNickname() {
    $filePath = RANDOM_NICKNAME_FILE;
    $nicknames = [];
    
    if (file_exists($filePath)) {
        $content = file_get_contents($filePath);
        $lines = explode("\n", $content);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) {
                continue;
            }
            $parts = explode('、', $line);
            foreach ($parts as $part) {
                $part = trim($part);
                if (!empty($part) && strlen($part) >= 2 && strlen($part) <= 20) {
                    $nicknames[] = $part;
                }
            }
        }
    }
    
    $nicknames = array_unique($nicknames);
    
    if (empty($nicknames)) {
        $nicknames = ['吃瓜群众', '匿名用户', '神秘人', '热心网友'];
    }
    
    return $nicknames[array_rand($nicknames)];
}

/**
 * 返回API响应
 * @param int $code 状态码
 * @param string $msg 消息
 * @param array $data 数据
 */
function apiResponse($code, $msg = '', $data = null) {
    $response = [
        'code' => $code,
        'msg' => $msg
    ];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * 检查请求参数
 * @param array $required 必需参数列表
 * @return array 返回请求参数
 */
function checkParams($required = []) {
    $params = [];
    $missing = [];
    
    foreach ($required as $param) {
        $value = $_POST[$param] ?? $_GET[$param] ?? null;
        if (empty($value) && $value !== '0') {
            $missing[] = $param;
        }
        $params[$param] = $value;
    }
    
    if (!empty($missing)) {
        apiResponse(1, '缺少参数: ' . implode(', ', $missing));
    }
    
    return $params;
}

/**
 * 获取客户端IP
 * @return string IP地址
 */
function getClientIP() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } elseif (isset($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    }
    return $ip;
}

/**
 * 安全过滤输入
 * @param string $str 输入字符串
 * @return string 过滤后的字符串
 */
function filterInput($str) {
    $str = trim($str);
    $str = htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
    return $str;
}
