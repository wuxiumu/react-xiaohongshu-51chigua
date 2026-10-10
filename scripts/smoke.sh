#!/usr/bin/env bash
# 冒烟：仓库不含默认口令；商务联系与落地页 SEO 仍在；
# 从仓库根目录拉起 PHP，检查 php-api 只读接口，并确认默认口令无法登录。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() {
  echo "SMOKE FAIL: $*" >&2
  exit 1
}

if ! command -v php >/dev/null 2>&1; then
  fail "未找到 php"
fi
if ! command -v curl >/dev/null 2>&1; then
  fail "未找到 curl"
fi

# env.php 只把这些字符串放在拒绝列表里，不能再出现在账号、页面或文档中。
leaked_password="$(printf '%s%s' admin 123)"
leaked_jwt="$(printf '%s%s' 'your-secret-key-change-this-in-' production)"
if grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  --exclude-dir=data \
  --exclude=env.php \
  -e "$leaked_password" \
  -e "$leaked_jwt" \
  . ; then
  fail "仓库中仍有默认管理员口令或 JWT 示例密钥"
fi

grep -q 'chigua517@outlook.com' php-api/publish_post.php .env.example \
  || fail "商务联系邮箱缺失"
grep -q 'https://51chigua.com/' react-front/public/index.html \
  || fail "落地页 SEO canonical 缺失"
grep -q '美女51吃瓜' react-front/public/index.html \
  || fail "落地页 SEO 标题缺失"

php -r '
require "php-api/admin_auth.php";
$leaked = "admin" . "123";
$blocked = verifyAdminLogin("admin", $leaked);
if (!empty($blocked["success"])) { fwrite(STDERR, "default password accepted\n"); exit(1); }
$placeholder = verifyAdminLogin("admin", "replace-with-a-strong-password");
if (!empty($placeholder["success"])) { fwrite(STDERR, "placeholder password accepted\n"); exit(1); }
' || fail "未配置时不应登录成功"

env ADMIN_USERNAME=admin \
  ADMIN_PASSWORD='smoke-only-password' \
  JWT_SECRET='smoke-test-secret-value' \
  php -r '
require "php-api/admin_auth.php";
$ok = verifyAdminLogin("admin", "smoke-only-password");
if (empty($ok["success"])) { fwrite(STDERR, "configured login failed\n"); exit(1); }
$token = generateToken(["username" => "admin", "nickname" => "smoke"]);
$checked = verifyToken($token);
if (empty($checked["valid"])) { fwrite(STDERR, "token verify failed\n"); exit(1); }
$bad = verifyAdminLogin("admin", "admin" . "123");
if (!empty($bad["success"])) { fwrite(STDERR, "leaked password still works\n"); exit(1); }
' || fail "配置管理员口令后登录或令牌校验失败"

PORT="${SMOKE_PORT:-8765}"
LOG="${TMPDIR:-/tmp}/chigua-smoke-php.log"
env -u ADMIN_USERNAME -u ADMIN_PASSWORD -u JWT_SECRET -u DB_PASS \
  php -S "127.0.0.1:${PORT}" scripts/dev-router.php >"$LOG" 2>&1 &
PHP_PID=$!
cleanup() {
  kill "$PHP_PID" >/dev/null 2>&1 || true
  wait "$PHP_PID" 2>/dev/null || true
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 50); do
  if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/php-api/get_posts.php"; then
    ready=1
    break
  fi
  sleep 0.1
done
if [[ "$ready" != 1 ]]; then
  cat "$LOG" >&2 || true
  fail "PHP 内置服务器未在仓库根目录就绪"
fi

assert_php() {
  local url="$1"
  local script="$2"
  local body
  body="$(curl -sf "$url")" || fail "请求失败: $url"
  printf '%s' "$body" | php -r "$script" || fail "响应不符合预期: $url"
}

assert_php "http://127.0.0.1:${PORT}/php-api/get_posts.php" '
$j = json_decode(stream_get_contents(STDIN), true);
if (!is_array($j) || ($j["code"] ?? 1) !== 0 || empty($j["list"])) exit(1);
'

assert_php "http://127.0.0.1:${PORT}/php-api/get_stats.php" '
$j = json_decode(stream_get_contents(STDIN), true);
if (!is_array($j) || ($j["code"] ?? 1) !== 0 || (int)($j["total_posts"] ?? 0) < 1) exit(1);
'

assert_php "http://127.0.0.1:${PORT}/php-api/get_yulu.php" '
$j = json_decode(stream_get_contents(STDIN), true);
if (!is_array($j) || ($j["code"] ?? 1) !== 0 || !isset($j["quotes"])) exit(1);
'

assert_php "http://127.0.0.1:${PORT}/php-api/get_hot_keywords.php" '
$j = json_decode(stream_get_contents(STDIN), true);
if (!is_array($j) || ($j["code"] ?? 1) !== 0 || empty($j["categories"])) exit(1);
'

leaked_password="$(printf '%s%s' admin 123)"
login_body="$(curl -sf -X POST --data "username=admin&password=${leaked_password}" \
  "http://127.0.0.1:${PORT}/php-api/admin_login.php")" \
  || fail "管理员登录接口不可达"
printf '%s' "$login_body" | php -r '
$j = json_decode(stream_get_contents(STDIN), true);
if (!is_array($j) || ($j["code"] ?? 0) === 0) exit(1);
' || fail "曾经公开的默认口令仍可登录"

for hidden in "/.env" "/.env.example" "/.git/config"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}${hidden}")"
  [[ "$code" == "404" ]] || fail "${hidden} 不应被内置服务器公开，HTTP ${code}"
done

echo "SMOKE OK"
