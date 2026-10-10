# 🍉 吃瓜点评 - 小红书风格图文社区

> 纯前端 React + 轻量 PHP 后端，**零数据库、纯 JSON 文件存储**，开箱即用的图片点评社区

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + react-router-dom + axios |
| 后端 | 原生 PHP（无需框架） |
| 存储 | JSON 文件（替代数据库） |
| 部署 | `npm run build` → `dist/` 目录直接丢到服务器 |

---

## 功能一览

### 👤 用户端

| 功能 | 说明 |
|------|------|
| 🏠 首页瀑布流 | 自动扫描 `data/img/` 图片，小红书卡片式展示 |
| 🔥 热门排行 | 按点赞×1 + 评论×2 + 分享×3 算法排序 |
| 📖 详情浏览 | 大图预览 + 帖子信息 + 互动操作 |
| 💬 评论回复 | 支持二级嵌套回复，树形展示 |
| 🤫 匿名评论 | 全局开关，开启后使用随机昵称签名 |
| ❤️ 点赞/转发 | 计数统计 + 分享弹窗（含二维码） |
| 📝 发布帖子 | 上传图片 + 标题 + 描述，即时生效 |
| 🎯 相关推荐 | 详情页底部随机推荐，无限下滑加载 |

### 🔐 管理端

| 功能 | 说明 |
|------|------|
| 🔑 管理员登录 | Token 认证，localStorage 持久化 |
| 📊 帖子管理 | 查看所有帖子、编辑信息、删除 |
| 💬 评论管理 | 查看、编辑、删除任意评论 |

---

## 系统架构

```
┌─────────────────────────────────────────────────┐
│                    用户浏览器                      │
│   ┌─────────────── React 前端 (SPA) ─────────────┐│
│   │ Navbar │ 瀑布流 │ 详情页 │ 管理后台 │ 发布弹窗 ││
│   └────────────────────┬─────────────────────────┘│
│                        │  axios 请求               │
└────────────────────────┼──────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────┐
│                        ▼                           │
│   ┌─────────── PHP 接口层 ───────────┐             │
│   │ get_posts / add_comment / like   │             │
│   │ publish / admin_* / stats ...    │             │
│   └───────────────┬──────────────────┘             │
│                   │                                 │
│                   ▼                                 │
│   ┌─────────── JSON 文件存储 ──────────┐            │
│   │ data/img/      图片文件             │            │
│   │ data/comments/ 评论 JSON            │            │
│   │ data/posts/    帖子 & 统计 JSON     │            │
│   │ data/nickname.md 随机昵称词库       │            │
│   └────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

---

## 项目结构

```
react-xiaohongshu-51chigua/
├── react-front/            # React 前端
│   └── src/
│       ├── api.js          # 接口封装（公共 + 管理）
│       ├── App.js          # 路由配置
│       └── components/
│           ├── Navbar.js           # 导航栏
│           ├── WaterfallList.js    # 首页瀑布流
│           ├── PostDetail.js       # 详情页
│           ├── PublishModal.js     # 发布弹窗
│           ├── ShareModal.js       # 分享弹窗
│           └── Admin/
│               ├── AdminLogin.js       # 管理员登录
│               └── AdminDashboard.js   # 管理后台
├── php-api/                # PHP 接口
│   ├── config.php          # 配置
│   ├── helper.php          # 公共工具函数
│   ├── get_posts.php       # 获取帖子列表
│   ├── get_random_posts.php# 随机推荐（无限加载）
│   ├── add_comment.php     # 发表评论
│   ├── get_comment.php     # 获取评论
│   ├── like_post.php       # 点赞
│   ├── share_post.php      # 转发
│   ├── get_post_stats.php  # 帖子统计
│   ├── publish_post.php    # 发布帖子
│   ├── get_random_nickname.php # 随机昵称
│   ├── admin_login.php     # 管理员登录
│   ├── admin_posts.php     # 帖子管理
│   └── admin_comments.php  # 评论管理
├── data/                   # 数据存储
│   ├── img/                # 图片目录
│   ├── comments/           # 评论数据
│   ├── posts/              # 帖子 & 统计
│   └── nickname.md         # 随机昵称词库
└── dist/                   # 构建产物（部署用）
```

---

## 快速开始

前端在 `react-front`，接口在 `php-api`。开发时 React 把以 `/php-api` 开头的请求代理到 `http://localhost:8000`（见 `react-front/package.json` 的 `proxy`）。PHP 内置服务器要从**仓库根目录**启动，才能同时提供 `php-api/` 和 `data/`。

```bash
# 0. 环境变量。只提交 .env.example，不要提交填好的 .env
cp .env.example .env
# 编辑 .env：把 ADMIN_PASSWORD、JWT_SECRET 换成你自己的值

# 1. 仓库根目录启动 PHP API（不要先 cd php-api）
php -S localhost:8000 scripts/dev-router.php

# 2. 另开终端，安装并启动 React 前端
cd react-front
npm install
npm start

# 3. 浏览器打开 http://localhost:3000
#    接口示例：http://localhost:8000/php-api/get_posts.php
```

管理员账号只存在于 `.env` 或进程环境变量中。未配置时无法登录，页面上也不再展示默认口令。发布达到上限时仍使用商务邮箱 `chigua517@outlook.com`（可用 `CONTACT_EMAIL` 覆盖）。

### 冒烟检查

```bash
./scripts/smoke.sh
```

脚本会确认仓库里没有默认口令，从仓库根目录拉起 PHP，请求 `php-api` 的帖子、统计、语录和热词接口，并确认 `.env` 不会被内置服务器直接下载。

### 构建部署

```bash
cd react-front
npm install
npm run build
# 产物在仓库根目录 dist/（前端构建结果，以及复制进去的 php-api 与 data）
# 把 .env 放在网站根目录、与 php-api 同级，且不要放到 Git 里
```

---

## 核心流程

### 浏览 & 评论

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as PHP 后端
    participant D as JSON 文件

    U->>F: 打开首页
    F->>B: GET /get_posts.php
    B->>D: 扫描 data/img/
    D-->>B: 返回图片列表
    B-->>F: JSON 帖子数据
    F->>U: 瀑布流展示

    U->>F: 点击卡片
    F->>U: 跳转详情页

    U->>F: 发表评论
    F->>B: POST /add_comment.php
    B->>D: 写入 comments/cmt_xxx.json
    D-->>B: 成功
    B-->>F: 返回结果
    F->>U: 刷新评论列表
```

### 管理后台

```mermaid
sequenceDiagram
    participant A as 管理员
    participant F as 前端
    participant B as PHP 后端
    participant D as JSON 文件

    A->>F: 访问 /admin
    F->>B: POST /admin_login.php
    B-->>F: 返回 Token
    F->>F: 存储到 localStorage

    A->>F: 进入管理后台
    F->>B: GET /admin_posts.php (带 Token)
    B->>D: 读取所有帖子
    D-->>F: 返回帖子列表
    F->>A: 表格展示

    A->>F: 删除帖子/评论
    F->>B: DELETE /admin_posts.php?id=xxx
    B->>D: 删除对应 JSON 文件
    D-->>B: 成功
    B-->>F: 返回结果
    F->>A: 刷新列表
```
