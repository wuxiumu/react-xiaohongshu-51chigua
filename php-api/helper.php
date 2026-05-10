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
    return uniqid('', true) . mt_rand(100, 999);
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

/**
 * 加载用户发布的帖子元数据
 * @return array 元数据索引 [img_path => post_meta]
 */
function loadUserPostsMeta() {
    $postsDir = getDataPath() . 'posts/';
    $meta = [];

    if (!is_dir($postsDir)) {
        return $meta;
    }

    foreach (scandir($postsDir) as $file) {
        if (strpos($file, 'user_') === 0 && substr($file, -5) === '.json') {
            $filePath = $postsDir . $file;
            $data = json_decode(file_get_contents($filePath), true);
            if ($data && isset($data['img'])) {
                $meta[$data['img']] = $data;
            }
        }
    }

    return $meta;
}

/**
 * 获取图片列表（附带元数据，按创建时间倒序）
 * @return array 帖子列表
 */
function getPostsList() {
    $imgList = getImgList();
    $userMeta = loadUserPostsMeta();
    $posts = [];

    foreach ($imgList as $img) {
        $fixedId = md5($img);

        // 如果有用户元数据，优先使用
        if (isset($userMeta[$img])) {
            $post = $userMeta[$img];
            // 确保必要字段存在
            $post['id'] = $post['id'] ?? $fixedId;
            $post['img'] = $post['img'] ?? $img;
            $post['title'] = $post['title'] ?? '未命名图片';
            $post['desc'] = $post['desc'] ?? '';
            $post['username'] = $post['username'] ?? '匿名用户';
            $post['create_time'] = $post['create_time'] ?? date('Y-m-d H:i:s', filemtime(dirname(__DIR__) . '/' . $img));
        } else {
            // 默认帖子的元数据
            $mtime = filemtime(dirname(__DIR__) . '/' . $img);
            // 用文件名序号做标题编号（1.jpeg -> 第1张）
            $basename = basename($img, '.' . pathinfo($img, PATHINFO_EXTENSION));
            $num = intval($basename);
            $num = $num > 0 ? $num : (count($posts) + 1);

            $post = [
                'id' => $fixedId,
                'img' => $img,
                'title' => '吃瓜美女图集 #' . $num,
                'desc' => '高清美女吃瓜日常点评',
                'username' => '管理员',
                'create_time' => date('Y-m-d H:i:s', $mtime)
            ];
        }

        $posts[] = $post;
    }

    // 按创建时间倒序排序
    usort($posts, function($a, $b) {
        return strtotime($b['create_time']) - strtotime($a['create_time']);
    });

    return $posts;
}
