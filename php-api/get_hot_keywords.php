<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// 读取 hotkeyword.md 文件
$keywordFile = dirname(__DIR__) . '/data/hotkeyword.md';
$categories = [];
$allKeywords = [];

if (file_exists($keywordFile)) {
    $content = file_get_contents($keywordFile);
    $lines = explode("\n", $content);
    $currentCategory = '';

    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) continue;

        // 检测到中文分类标题（如一、二、...）
        if (preg_match('/^[一二三四五六七八九十]+、/', $line)) {
            // 提取分类名
            preg_match('/^[一二三四五六七八九十]+、(.+)/', $line, $matches);
            $currentCategory = isset($matches[1]) ? trim($matches[1]) : '';
            if (!isset($categories[$currentCategory])) {
                $categories[$currentCategory] = [];
            }
            continue;
        }

        // 解析列表项：- xxx: 说明
        if (strpos($line, '- ') === 0) {
            $item = substr($line, 2);
            // 提取冒号前的关键词部分
            if (strpos($item, ':') !== false) {
                list($keywords, $desc) = explode(':', $item, 2);
            } else {
                $keywords = $item;
            }

            // 拆分关键词（支持顿号分隔）
            $parts = explode('、', trim($keywords));
            if (!empty($currentCategory)) {
                foreach ($parts as $kw) {
                    $kw = trim($kw);
                    if (!empty($kw) && strlen($kw) >= 2) {
                        $categories[$currentCategory][] = $kw;
                    }
                }
            } else {
                foreach ($parts as $kw) {
                    $kw = trim($kw);
                    if (!empty($kw) && strlen($kw) >= 2) {
                        $allKeywords[] = $kw;
                    }
                }
            }
            continue;
        }

        // 解析列表项：* xxx
        if (strpos($line, '* ') === 0) {
            $item = trim(substr($line, 2));
            if (!empty($currentCategory)) {
                $categories[$currentCategory][] = $item;
            }
            continue;
        }
    }
}

// 如果没有任何数据，返回默认值
if (empty($categories) && empty($allKeywords)) {
    $categories = [
        '热门话题' => ['明星绯闻', '情感纠纷', '职场爆料'],
        '搜索技巧' => ['组合搜索', '限定搜索', '反向验证']
    ];
}

echo json_encode(['code' => 0, 'categories' => $categories], JSON_UNESCAPED_UNICODE);
