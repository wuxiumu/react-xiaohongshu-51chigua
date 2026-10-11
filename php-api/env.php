<?php
/**
 * 从进程环境与仓库根目录 .env 读取配置。
 * 已存在的环境变量优先，避免覆盖部署平台注入的值。
 */

function load_project_env() {
    static $loaded = false;
    if ($loaded) {
        return;
    }
    $loaded = true;

    $root = dirname(__DIR__);
    foreach ([$root . '/.env', __DIR__ . '/.env'] as $path) {
        if (is_readable($path)) {
            load_env_file($path);
        }
    }
}

function load_env_file($path) {
    $lines = file($path, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        if (strpos($line, 'export ') === 0) {
            $line = trim(substr($line, 7));
        }
        $eq = strpos($line, '=');
        if ($eq === false) {
            continue;
        }

        $key = trim(substr($line, 0, $eq));
        $value = trim(substr($line, $eq + 1));
        if ($key === '' || !preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $key)) {
            continue;
        }

        $len = strlen($value);
        if ($len >= 2) {
            $quote = $value[0];
            if (($quote === '"' || $quote === "'") && $value[$len - 1] === $quote) {
                $value = substr($value, 1, -1);
            }
        }

        if (getenv($key) !== false) {
            continue;
        }
        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
    }
}

function env_value($key, $default = '') {
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }
    return $value;
}

/**
 * 拒绝空值、示例占位符，以及曾经写进仓库的默认口令。
 */
function is_placeholder_secret($value) {
    $blocked = [
        '',
        'admin123',
        'change-me',
        'changeme',
        'replace-with-a-strong-password',
        'replace-with-a-long-random-string',
        'your-secret-key-change-this-in-production',
    ];
    return in_array((string) $value, $blocked, true);
}
