# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

视频去字幕小程序 — AI 智能去除视频字幕与水印，支持微信/支付宝小程序和 H5。

## 技术栈

**前端**: uni-app 3.0 + Vue 3.4 (Composition API + `<script setup>`) + Pinia 2 + TypeScript
**后端**: Express + MySQL2 + Redis + BullMQ + JWT 认证
**构建**: Vite 5 + @dcloudio/vite-plugin-uni
**设计系统**: Apple HIG 风格，CSS 变量定义在 `src/styles/tokens.css`

## 常用命令

```bash
# 前端开发（在 HBuilderX 中运行到微信小程序，或命令行）
npm run dev:mp-weixin          # 微信小程序开发编译
npm run build:mp-weixin        # 微信小程序生产构建
npm run dev:h5                 # H5 开发

# 后端开发
cd server
npm run dev:quick              # 开发模式（内存数据库，无需 MySQL/Redis）
npm run dev                    # 完整模式（需要 MySQL + Redis）
npm run test                   # 运行测试（Jest + Supertest）
```

后端默认端口 `3000`，前端通过 `VITE_API_BASE` 环境变量配置 API 地址（默认 `http://localhost:3000`）。

## 架构

### 前端（src/）

```
src/
├── api/request.ts          # 统一请求封装（uni.request + uni.uploadFile + JWT）
├── store/                  # Pinia 状态管理
│   ├── user.ts             # 用户登录/信息
│   ├── task.ts             # 视频任务 CRUD + 轮询
│   └── order.ts            # 订单/支付
├── components/             # 全局组件（PrivacyDialog, TaskStatus, VideoUploader）
├── pages/                  # 主包页面（TabBar: 首页/历史/我的）
├── pages-sub/              # 分包
│   ├── video/              # 上传/预览/处理/结果/链接解析
│   └── service/            # 充值/会员
├── styles/                 # 设计系统
│   ├── tokens.css          # 设计变量（颜色/间距/圆角/阴影）
│   ├── base.css            # 全局重置
│   └── utilities.css       # 工具类
└── utils/                  # 工具函数（轮询/格式化/上传/平台判断）
```

- 路由配置: `src/pages.json`（含分包和 preloadRule）
- 小程序配置: `src/manifest.json` 的 `mp-weixin` 节
- 编译产物: `dist/build/mp-weixin/`

### 后端（server/）

三层架构: `routes/` → `controllers/` → `services/`，数据层 `models/`。

API 统一前缀 `/v1`，主要路由组：
- `/v1/auth` — 微信登录 / JWT Token
- `/v1/tasks` — 视频任务（上传用 multer，支持 SSE 进度推送）
- `/v1/orders` — 支付订单
- `/v1/points` — 积分系统
- `/v1/packages` — 套餐列表
- `/health` — 健康检查

认证: Bearer JWT，`authenticate` 中间件注入 `req.user`。

开发快速模式 (`dev:quick`) 使用内存数据库，无需外部依赖。

## 关键约束

### WXSS 限制（必须遵守）
- **CSS 变量根选择器**: 必须用 `page, :root` 而非单独的 `:root`，否则小程序端变量不生效导致 UI 全部崩溃
- **禁止渐变色**: WXSS 不支持 `linear-gradient` / `radial-gradient`，必须使用纯色
- **禁止通配符选择器**: `*` 不可用，用具体元素/类选择器替代
- **不支持的伪类/伪元素**: `:focus-visible`、`:focus:not()`、`::selection`、`::before`、`::after` 均不可用
- **不支持标签选择器**: `p`、`h1` 等标签选择器在小程序端有警告，优先使用 class 选择器

### 开发规范
- **中文优先**: 面向用户的 UI 文字默认使用中文
- **复用组件**: 2 个以上页面有相似 UI 块时，提取为 `src/components/` 下的公共组件
- **设计变量**: 禁止硬编码颜色/间距/圆角值，必须引用 `tokens.css` 中的 CSS 变量
- **条件编译**: 小程序特有代码用 `// #ifdef MP-WEIXIN` / `// #endif` 包裹
- **编码**: UTF-8，LF 换行，2 空格缩进（`.editorconfig`）

### 开发流程
- 每次代码改动后必须编译验证，确认无报错
- 多步骤任务使用子智能体并行执行以提高效率
- 后端开发使用 `dev:quick` 模式，无需启动 MySQL/Redis

## 设计系统

定义在 `src/styles/tokens.css`，所有组件必须通过 CSS 变量引用：

| 类别 | 示例 |
|------|------|
| 主色 | `--color-primary: #007AFF` |
| 语义色 | `--color-success: #34C759` / `--color-warning: #FF9500` / `--color-error: #FF3B30` |
| 背景 | `--color-bg-primary: #F2F2F7` / `--color-bg-secondary: #FFFFFF` |
| 文字 | `--color-text-primary: #1C1C1E` / `--color-text-secondary: #8E8E93` |
| 间距 | `--space-1` (4px) 到 `--space-20` (80px)，4px 网格 |
| 圆角 | `--radius-xs` (4px) 到 `--radius-full` (9999px) |
| 阴影 | `--shadow-xs` 到 `--shadow-xl` |

## 环境配置

- `project.config.json` — 微信开发者工具配置，`urlCheck: false` 允许开发环境请求
- `.env.development` — `VITE_API_BASE=http://localhost:3000`
- 微信开发者工具需开启**服务端口**（设置 → 安全设置）才能被 HBuilderX 调用
