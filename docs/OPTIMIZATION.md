# react-xiaohongshu-51chigua · 深优化建议（文档先行）

> 与父仓 `docs/OPTIMIZATION-NEXT.md` Top8 对齐。  
> 轻量加固：✅ C2 PR（管理员口令移出仓库 / 根目录 `.env` / `scripts/smoke.sh`）。**下列留给下一轮代码。**

## 现状对照

| 项 | 现状 |
|---|---|
| 结构 | `react-front/` + `php-api/` + `data/`（JSON/图片） |
| 部署 | `deploy.sh` + `DEPLOY.md` |
| 配置 | `data/config.json`；口令应仅 `.env` |
| Demo | 缺稳定种子帖；克隆后瀑布流可能空 |

## 建议（可执行）

| # | 建议 | 类型 | 验收 |
|---|---|---|---|
| 1 | 管理员口令仅 `.env` + 首次启动检测：缺 env 拒绝管理 API | 安全 | 无 env 无法后台写 |
| 2 | 种子数据：10 条示例帖 + 图（LFS 或外链 CDN），克隆即有瀑布流 | Demo | 开箱非空首页 |
| 3 | 主题色 / 社区名配置化（`data/config.json` 或根 `config.brand.json`） | 定制 | 改一处换皮 |
| 4 | `./scripts/smoke.sh` 写进 README 醒目「快速验证」 | 可运行 | 新人可跑 |
| 5 | 部署：`deploy.sh` 与 Nginx 示例对齐到 `DEPLOY.md` 一步步可跟 | 文档 | 跟做可上线 |
| 6 | UGC 审核开关说明（默认需审或可关）写入 README/本文件 | 安全/文档 | 策略清晰 |

## 建议落地顺序

1 → 4 → 2 → 3 → 5 → 6。

## 定制联系

微信 **qingbao199101**（备注：图文社区）· [wuxiumu@163.com](mailto:wuxiumu@163.com)
