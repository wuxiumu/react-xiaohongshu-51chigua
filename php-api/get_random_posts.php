<?php
header("Content-Type: application/json;charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'helper.php';

$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 8;
$exclude_id = $_GET['exclude_id'] ?? '';

if ($limit <= 0 || $limit > 50) {
    $limit = 8;
}
if ($offset < 0) {
    $offset = 0;
}

$imgList = getImgList();
$posts = [];

foreach($imgList as $idx => $img) {
    $fixedId = md5($img);
    $posts[] = [
        'id' => $fixedId,
        'img' => $img,
        'title' => '吃瓜美女图集'.($idx+1),
        'desc' => '高清美女吃瓜日常点评',
        'create_time' => date('Y-m-d H:i:s', filemtime(dirname(__DIR__) . '/' . $img))
    ];
}

// Filter out excluded post
if (!empty($exclude_id)) {
    $posts = array_values(array_filter($posts, function($post) use ($exclude_id) {
        return $post['id'] !== $exclude_id;
    }));
}

$total = count($posts);

// Shuffle posts using a seed based on offset to get different order each page
if ($total > 0) {
    $seed = intval($offset / $total) * $total;
    mt_srand($seed + $offset);
    $indices = array_keys($posts);
    shuffle($indices);
    $shuffled = [];
    foreach ($indices as $i) {
        $shuffled[] = $posts[$i];
    }
    $posts = $shuffled;
}

// Calculate wrapped offset for infinite loop
$wrappedOffset = $offset % max($total, 1);
$result = array_slice($posts, $wrappedOffset, $limit);

echo json_encode([
    'code' => 0,
    'list' => $result,
    'total' => $total,
    'has_more' => ($offset + count($result)) < $total
], JSON_UNESCAPED_UNICODE);
?>
