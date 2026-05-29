# CloudLadder (政企通) — 科创项目申报智能助手

<p align="center">
  <strong>让科技企业不错过每一个政策扶持机会</strong>
</p>

---

## 项目简介

**CloudLadder（政企通）** 是一款专为中小科技企业打造的科创项目申报服务平台。系统通过智能聚合各级政府扶持政策、AI 解析政策文本、基于企业档案的自动化匹配、全流程申报管理等核心能力，帮助企业高效发现、评估和申报各类科技扶持项目。

### 适用场景

- 🏢 **中小科技企业** — 快速发现可申报的扶持政策，提高申报效率
- 🏭 **科技园区/孵化器** — 园区运营方统一管理入驻企业申报情况
- 📋 **政策申报服务机构** — 批量管理客户企业的申报进度

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | React 18 + TypeScript |
| **构建工具** | Vite 6 |
| **样式方案** | Tailwind CSS 3 |
| **状态管理** | Zustand |
| **路由** | React Router v7 |
| **后端框架** | Express.js + TypeScript |
| **数据库** | SQLite (better-sqlite3) |
| **认证** | JWT + bcrypt |
| **部署** | Docker / Vercel |

---

## 快速开始

### 环境要求

- Node.js >= 18.x
- pnpm（推荐）或 npm

### 安装和运行

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env .env.local
# 编辑 .env.local 设置 JWT_SECRET 等配置

# 3. 启动开发环境（前后端并行）
pnpm dev

# 4. 构建生产版本
pnpm build

# 5. 启动生产服务
pnpm start
```

### Docker 部署

```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f
```

---

## 功能模块

| 模块 | 说明 |
|------|------|
| 📊 **仪表盘** | 企业科创健康度评分、推荐项目、申报日历 |
| 📡 **政策雷达** | 多维度政策筛选、搜索、订阅、新政策提醒 |
| 🤖 **AI 政策解析** | 智能解析政策原文，自动提取结构化信息 |
| 🎯 **智能匹配** | 基于企业档案自动计算政策匹配度 |
| 🏢 **企业档案** | 基本信息、资质证照、财务资料、合同协议、团队成员 |
| ✅ **申报工作台** | 任务清单、进度追踪、材料管理 |
| 🕷️ **爬虫管理** | 政策源管理、定时抓取、自动入库 |
| 🔗 **资源库** | 政府网站和申报平台链接管理 |
| 🚀 **园区驾驶舱** | 企业健康度总览、一键推荐、免申即享管理 |

---

## 默认账号

系统首次启动时自动创建演示账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@cloudladder.com | admin123 |

---

## 项目结构

```
├── api/                  # 后端代码
│   ├── middleware/       # 中间件（认证、权限）
│   ├── routes/           # 路由控制器
│   ├── services/         # 业务逻辑层（爬虫、匹配、解析）
│   ├── app.ts            # Express 应用配置
│   ├── db.ts             # 数据库初始化和迁移
│   └── server.ts         # 服务器入口
├── src/                  # 前端代码
│   ├── components/       # 通用组件
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # 状态管理、工具函数
│   └── pages/            # 页面组件
├── dist/                 # 前端构建产物
├── data/                 # SQLite 数据库文件（运行时生成）
├── public/               # 静态资源
├── uploads/              # 上传文件存储
├── Dockerfile            # Docker 构建配置
├── docker-compose.yml    # Docker Compose 编排
└── vercel.json           # Vercel 部署配置
```

---

## 部署

### Vercel 部署（推荐）

项目已配置 `vercel.json`，可直接部署到 Vercel：

1. Fork 或导入项目到 Vercel
2. 设置环境变量 `JWT_SECRET`
3. 部署即可

### Docker 部署

```bash
docker compose up -d
```

服务将在 `http://localhost:3001` 启动。

---

## 许可证

MIT