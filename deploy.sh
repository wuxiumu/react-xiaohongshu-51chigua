#!/bin/bash

# 吃瓜美女点评 - 一键部署脚本
# 使用方法: ./deploy.sh [部署目录]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 默认部署目录
DEPLOY_DIR="${1:-./dist}"
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  吃瓜美女点评 - 一键部署脚本${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: npm 未安装${NC}"
    exit 1
fi

echo -e "${YELLOW}1. 进入前端目录...${NC}"
cd "$PROJECT_ROOT/react-front"

echo -e "${YELLOW}2. 安装依赖（如果需要）...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
fi

echo -e "${YELLOW}3. 构建 React 项目...${NC}"
npm run build

echo -e "${YELLOW}4. 准备部署目录...${NC}"
# 创建部署目录
mkdir -p "$PROJECT_ROOT/dist"

# 清空部署目录（保留）
rm -rf "$PROJECT_ROOT/dist"/*

# 复制构建文件
echo -e "${YELLOW}5. 复制构建文件...${NC}"
cp -r "$PROJECT_ROOT/react-front/build/"* "$PROJECT_ROOT/dist/"

# 复制 PHP API
echo -e "${YELLOW}6. 复制 PHP 接口...${NC}"
cp -r "$PROJECT_ROOT/php-api" "$PROJECT_ROOT/dist/"

# 复制数据目录
echo -e "${YELLOW}7. 复制数据目录...${NC}"
cp -r "$PROJECT_ROOT/data" "$PROJECT_ROOT/dist/"

# 复制 .htaccess
echo -e "${YELLOW}8. 复制 Apache 配置...${NC}"
cp "$PROJECT_ROOT/react-front/public/.htaccess" "$PROJECT_ROOT/dist/.htaccess"

# 创建 Nginx 配置示例
echo -e "${YELLOW}9. 创建 Nginx 配置示例...${NC}"
cat > "$PROJECT_ROOT/dist/nginx.conf.example" << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html index.php;

    # PHP 处理
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # API 和 Data 目录
    location ~ ^/(php-api|data)/ {
        try_files $uri $uri/ =404;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # React Router 支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 创建 Docker 配置
echo -e "${YELLOW}10. 创建 Docker 配置...${NC}"
cat > "$PROJECT_ROOT/dist/Dockerfile" << 'EOF'
FROM php:8.1-apache

# 启用 Apache 模块
RUN a2enmod rewrite headers expires deflate

# 安装必要的 PHP 扩展
RUN docker-php-ext-install mysqli pdo pdo_mysql

# 复制项目文件
COPY . /var/www/html/

# 设置权限
RUN chown -R www-data:www-data /var/www/html/data
RUN chmod -R 755 /var/www/html/data

# 暴露端口
EXPOSE 80
EOF

cat > "$PROJECT_ROOT/dist/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:80"
    volumes:
      - ./data:/var/www/html/data
    restart: unless-stopped
EOF

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}     部署准备完成！${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "部署目录: ${YELLOW}$PROJECT_ROOT/dist${NC}"
echo ""
echo "部署方式选择："
echo ""
echo "1. Apache 服务器："
echo "   - 确保启用 mod_rewrite 模块"
echo "   - 将 dist/ 目录内容复制到网站根目录"
echo "   - .htaccess 文件会自动处理路由"
echo ""
echo "2. Nginx 服务器："
echo "   - 参考 dist/nginx.conf.example 配置"
echo "   - 将 dist/ 目录内容复制到网站根目录"
echo ""
echo "3. Docker 部署："
echo "   cd dist && docker-compose up -d"
echo ""
echo "4. PHP 内置服务器（开发测试）："
echo "   cd dist && php -S 0.0.0.0:8000"
echo ""
echo -e "${GREEN}完成！${NC}"
