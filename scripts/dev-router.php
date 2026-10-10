<?php
/**
 * PHP 内置服务器路由。
 * 在仓库根目录启动：php -S localhost:8000 scripts/dev-router.php
 * 拒绝直接下载 .env 等点文件。返回 false 时由内置服务器按原路径响应。
 */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = rawurldecode($path === null || $path === '' ? '/' : $path);

if (preg_match('#(?:^|/)\.#', $path)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Not found\n";
    return true;
}

return false;
