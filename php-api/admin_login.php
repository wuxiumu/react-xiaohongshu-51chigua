<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once 'helper.php';
require_once 'admin_auth.php';

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$nickname = $_POST['nickname'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(['code'=>1, 'msg'=>'请输入账号和密码'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 验证登录
$result = verifyAdminLogin($username, $password);

if (!$result['success']) {
    echo json_encode(['code'=>1, 'msg'=>$result['msg']], JSON_UNESCAPED_UNICODE);
    exit;
}

// 生成 Token
$tokenData = [
    'username' => $username,
    'nickname' => $nickname ?: $result['nickname']
];
$token = generateToken($tokenData);

// 返回登录成功信息
echo json_encode([
    'code' => 0,
    'msg' => '登录成功',
    'data' => [
        'token' => $token,
        'username' => $username,
        'nickname' => $nickname ?: $result['nickname'],
        'expire' => JWT_EXPIRE
    ]
], JSON_UNESCAPED_UNICODE);
?>
