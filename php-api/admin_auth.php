<?php
/**
 * 管理员配置
 * 默认管理员账号
 */

// 默认管理员账号（建议部署后修改）
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', 'admin123');
define('ADMIN_NICKNAME', '超级管理员');

// JWT 密钥（用于生成登录令牌，部署时请务必修改）
define('JWT_SECRET', 'your-secret-key-change-this-in-production');
define('JWT_EXPIRE', 86400); // 24小时有效期

/**
 * 生成 JWT Token
 */
function generateToken($data) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $time = time();
    $payload = json_encode([
        'iss' => 'xiaohongshu', // 签发者
        'iat' => $time, // 签发时间
        'exp' => $time + JWT_EXPIRE, // 过期时间
        'sub' => $data['username'], // 用户名
        'role' => 'admin', // 角色
        'nickname' => $data['nickname'] ?? ADMIN_NICKNAME
    ]);
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return "$base64Header.$base64Payload.$base64Signature";
}

/**
 * 验证 JWT Token
 */
function verifyToken($token) {
    if (empty($token)) {
        return ['valid' => false, 'msg' => '未登录'];
    }
    
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return ['valid' => false, 'msg' => '无效的令牌'];
    }
    
    list($base64Header, $base64Payload, $base64Signature) = $parts;
    
    // 验证签名
    $signature = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true);
    $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    if (!hash_equals($expectedSignature, $base64Signature)) {
        return ['valid' => false, 'msg' => '签名无效'];
    }
    
    // 解析payload
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)), true);
    
    if (!$payload) {
        return ['valid' => false, 'msg' => '无法解析令牌'];
    }
    
    // 检查过期时间
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return ['valid' => false, 'msg' => '登录已过期'];
    }
    
    return ['valid' => true, 'data' => $payload];
}

/**
 * 验证管理员登录
 */
function verifyAdminLogin($username, $password) {
    if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
        return [
            'success' => true,
            'username' => $username,
            'nickname' => ADMIN_NICKNAME
        ];
    }
    return ['success' => false, 'msg' => '账号或密码错误'];
}

/**
 * 检查是否是管理员请求
 */
function checkAdminAuth() {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = str_replace('Bearer ', '', $token);
    
    return verifyToken($token);
}

/**
 * 要求管理员权限
 */
function requireAdmin() {
    $result = checkAdminAuth();
    if (!$result['valid']) {
        http_response_code(401);
        echo json_encode(['code' => 401, 'msg' => $result['msg']], JSON_UNESCAPED_UNICODE);
        exit;
    }
    return $result['data'];
}
