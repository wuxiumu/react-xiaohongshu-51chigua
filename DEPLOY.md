# 吃瓜美女点评 - 部署文档

## 📋 系统要求

- **Web 服务器**: Apache (推荐) 或 Nginx
- **PHP**: 7.4+ (推荐 8.0+)
- **Node.js**: 16+ (仅构建时需要)
- **操作系统**: Linux / macOS / Windows (WAMP/XAMPP)

## 🚀 快速部署

### 方式一：一键部署脚本（推荐）

```bash
# 1. 克隆项目
git clone <项目地址>
cd react-xiaohongshu-51chigua

# 2. 运行部署脚本
./deploy.sh

# 3. 将 dist/ 目录内容上传到服务器
# Apache 示例：/var/www/html/
# Nginx 示例：/usr/share/nginx/html/
```

### 方式二：手动部署

#### 1. 构建前端

```bash
cd react-front
npm install
npm run build
```

#### 2. 准备部署文件

```bash
# 创建部署目录
mkdir -p dist

# 复制构建文件
cp -r react-front/build/* dist/

# 复制 PHP API
cp -r php-api dist/

# 复制数据目录
cp -r data dist/

# 复制 .htaccess
cp react-front/public/.htaccess dist/
```

#### 3. 上传到服务器

将 `dist/` 目录内容上传到 Web 服务器根目录。

## 🔧 服务器配置

### Apache 配置

确保已启用以下模块：

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate
sudo systemctl restart apache2
```

`.htaccess` 文件已包含在项目中，无需额外配置。

### Nginx 配置

创建配置文件 `/etc/nginx/sites-available/xiaohongshu`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html index.php;

    # PHP 处理
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
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
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/xiaohongshu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### PHP 内置服务器（开发测试）

```bash
cd dist
php -S 0.0.0.0:8000
```

访问：http://localhost:8000

## 🐳 Docker 部署

### 使用 Docker Compose

```bash
cd dist
docker-compose up -d
```

访问：http://localhost:8080

### 自定义 Dockerfile

```bash
cd dist
docker build -t xiaohongshu .
docker run -d -p 8080:80 -v $(pwd)/data:/var/www/html/data xiaohongshu
```

## 📁 目录结构

```
dist/                          # 部署目录
├── index.html                 # React 入口
├── static/                    # 静态资源
│   ├── css/
│   ├── js/
│   └── media/
├── php-api/                   # PHP 接口
│   ├── helper.php
│   ├── get_posts.php
│   ├── add_comment.php
│   ├── get_comment.php
│   ├── like_post.php
│   ├── share_post.php
│   ├── get_post_stats.php
│   └── get_random_nickname.php
├── data/                      # 数据目录
│   ├── img/                  # 图片资源
│   ├── posts/                # 帖子数据
│   ├── comments/             # 评论数据
│   ├── nickname.md           # 随机昵称库
│   └── config.json           # 配置文件
├── .htaccess                 # Apache 配置
├── nginx.conf.example        # Nginx 配置示例
├── Dockerfile                # Docker 配置
└── docker-compose.yml        # Docker Compose 配置
```

## 🔐 权限设置

```bash
# 设置数据目录权限
chmod -R 755 data/
chmod -R 777 data/comments/
chmod -R 777 data/posts/
chown -R www-data:www-data data/
```

## 🌐 访问地址

- **首页**: http://your-domain.com/
- **详情页**: http://your-domain.com/post/帖子ID
- **API**: http://your-domain.com/php-api/xxx.php

## 📝 环境变量（可选）

创建 `data/config.json`：

```json
{
  "site_name": "吃瓜美女点评",
  "page_size": 12,
  "allow_anonymous": true,
  "max_comment_length": 500,
  "upload_max_size": 10485760
}
```

## 🐛 常见问题

### 1. 404 错误

**Apache**: 确保 `mod_rewrite` 已启用，且 `.htaccess` 文件存在。

**Nginx**: 检查配置文件中的 `try_files` 指令。

### 2. PHP 接口返回 500

检查 PHP 错误日志：

```bash
tail -f /var/log/apache2/error.log
# 或
tail -f /var/log/nginx/error.log
```

### 3. 图片无法加载

确保 `data/img/` 目录存在且有图片：

```bash
ls -la data/img/
```

### 4. 评论无法保存

检查数据目录权限：

```bash
chmod -R 777 data/comments/
chmod -R 777 data/posts/
```

### 5. 前端路由刷新后 404

确保服务器已配置支持前端路由（参见上方的 Apache/Nginx 配置）。

## 🔧 维护

### 备份数据

```bash
# 备份数据目录
tar -czvf backup-$(date +%Y%m%d).tar.gz data/

# 备份图片
tar -czvf img-backup-$(date +%Y%m%d).tar.gz data/img/
```

### 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
./deploy.sh

# 3. 上传覆盖（保留 data 目录）
# 注意：不要覆盖 data 目录，避免数据丢失
```

## 📞 技术支持

如有问题，请查看项目 README 或提交 Issue。

## 📄 许可证

MIT License
