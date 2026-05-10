// 生成 OG 图片和 favicon 的 ICO 版本
// 用法: node scripts/generate-assets.js
// 需要: npm install sharp (可选，安装后生成 PNG；不安装只生成 SVG)

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// OG Image SVG (1200x630)
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF5F7"/>
      <stop offset="100%" stop-color="#FFE8EC"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FF2442"/>
      <stop offset="100%" stop-color="#FF6B8A"/>
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="1200" height="630" fill="url(#bg)" rx="0"/>

  <!-- 左侧装饰：大西瓜 -->
  <g transform="translate(200, 315)">
    <circle cx="0" cy="0" r="180" fill="#4CAF50"/>
    <circle cx="0" cy="0" r="150" fill="#FF5252"/>
    <ellipse cx="-50" cy="-60" rx="10" ry="16" fill="#333" transform="rotate(-15 -50 -60)"/>
    <ellipse cx="50" cy="-60" rx="10" ry="16" fill="#333" transform="rotate(15 50 -60)"/>
    <ellipse cx="-60" cy="30" rx="10" ry="16" fill="#333" transform="rotate(-25 -60 30)"/>
    <ellipse cx="60" cy="30" rx="10" ry="16" fill="#333" transform="rotate(25 60 30)"/>
    <ellipse cx="0" cy="80" rx="10" ry="16" fill="#333"/>
    <text x="0" y="10" font-family="Arial Black,sans-serif" font-size="100" font-weight="900" fill="#FFF" text-anchor="middle">51</text>
    <text x="0" y="70" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="42" font-weight="bold" fill="#FFB6C1" text-anchor="middle">吃瓜</text>
  </g>

  <!-- 右侧文字 -->
  <text x="700" y="240" font-family="Arial Black,sans-serif" font-size="80" font-weight="900" fill="url(#textGrad)">美女51吃瓜</text>
  <text x="700" y="320" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="36" fill="#666">热点点评社区</text>
  <text x="700" y="380" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="24" fill="#999">看热点 · 聊八卦 · 写点评</text>
  <text x="700" y="440" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="20" fill="#bbb">吃瓜也要有态度！</text>

  <!-- 装饰圆点 -->
  <circle cx="1100" cy="80" r="30" fill="#FF5252" opacity="0.1"/>
  <circle cx="1140" cy="140" r="20" fill="#FF2442" opacity="0.08"/>
  <circle cx="1080" cy="550" r="25" fill="#FFB6C1" opacity="0.15"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'og-image.svg'), ogSvg, 'utf8');

// 尝试用 Sharp 生成 PNG，如果不可用则提示
try {
  const sharp = require('sharp');
  sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'og-image.png'))
    .then(() => {
      console.log('✓ og-image.png 生成成功 (1200x630)');
    })
    .catch((err) => {
      console.error('PNG 生成失败，已保留 SVG:', err.message);
    });
} catch (e) {
  console.log('✓ og-image.svg 已生成');
  console.log('  提示: 安装 sharp (npm install sharp) 可自动生成 PNG 版本');
  console.log('  或者手动将 og-image.svg 用在线工具转为 og-image.png');
}

// 同时生成 favicon.ico 的 PNG 版本（用于老浏览器回退）
const faviconSvg = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8');

try {
  const sharp = require('sharp');
  sharp(Buffer.from(faviconSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'logo192.png'))
    .then(() => {
      console.log('✓ logo192.png (favicon 版) 生成成功');
    })
    .catch((err) => {
      console.error('Favicon PNG 生成失败:', err.message);
    });
} catch (e) {
  // sharp 不可用，跳过
}
