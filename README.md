# 视频去字幕小程序

一个支持多端（微信小程序、支付宝小程序、H5、App）的视频去字幕/去图标小程序。

## 技术栈

- **前端框架**: uni-App (Vue3 + Vite + TypeScript)
- **状态管理**: Pinia
- **数据库**: MySQL 5.7.44
- **容器化**: Docker + Docker Compose
- **第三方服务**: 阿里云视频处理 API

## 功能特性

- ✅ 视频上传和预览
- ✅ 去字幕处理（阿里云接口）
- ✅ 去图标处理
- ✅ 异步任务管理
- ✅ 用户系统（微信/支付宝登录）
- ✅ 积分计费系统
- ✅ 处理历史记录

## 项目结构

```
video-subtitle-remover/
├── src/
│   ├── api/                 # API 接口
│   │   └── request.ts       # 网络请求工具
│   ├── components/          # 组件
│   ├── pages/               # 页面
│   │   ├── index/           # 首页
│   │   ├── upload/          # 上传页
│   │   ├── preview/         # 预览页
│   │   ├── processing/      # 处理页
│   │   ├── result/          # 结果页
│   │   ├── login/           # 登录页
│   │   ├── user/            # 用户中心
│   │   ├── history/         # 历史记录
│   │   └── recharge/        # 充值页
│   ├── store/               # 状态管理
│   │   ├── user.ts
│   │   ├── task.ts
│   │   └── order.ts
│   ├── types/               # TypeScript 类型
│   │   ├── user.d.ts
│   │   ├── task.d.ts
│   │   └── api.d.ts
│   └── utils/               # 工具函数
│       ├── storage.ts
│       └── platform.ts
├── database/
│   └── init.sql             # 数据库初始化脚本
├── Dockerfile               # Docker 构建配置
├── docker-compose.yml       # Docker Compose 配置
├── nginx.conf               # Nginx 配置
└── package.json
```

## 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# H5 端开发
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin

# 支付宝小程序开发
npm run dev:mp-alipay
```

### 生产构建

```bash
# 构建 H5
npm run build:h5

# 构建微信小程序
npm run build:mp-weixin

# 构建支付宝小程序
npm run build:mp-alipay
```

### Docker 部署

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 访问应用
# H5: http://localhost
# 后端 API: http://localhost:3000
# MySQL: localhost:3306
```

## 数据库配置

数据库初始化脚本位于 `database/init.sql`，包含以下表：

- `users` - 用户表
- `tasks` - 任务表
- `orders` - 订单表
- `usage_logs` - 使用记录表

## 环境变量

在 `.env` 文件中配置以下环境变量：

```bash
# 后端服务
NODE_ENV=production
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=video_remover

# JWT 认证
JWT_SECRET=your_jwt_secret

# 阿里云配置
ALIYUN_ACCESS_KEY=your_access_key
ALIYUN_SECRET_KEY=your_secret_key
```

## 多端适配

项目使用条件编译实现多端适配：

```typescript
// #ifdef MP-WEIXIN
// 微信小程序特定代码
// #endif

// #ifdef MP-ALIPAY
// 支付宝小程序特定代码
// #endif

// #ifdef H5
// H5 端特定代码
// #endif
```

## 开发进度

- [x] Phase 1: 基础架构搭建
- [ ] Phase 2: 核心功能开发
- [ ] Phase 3: 用户系统
- [ ] Phase 4: 计费系统
- [ ] Phase 5: 优化与部署

## 待完成事项

1. 后端 API 开发（Node.js/Express 或 Python/Flask）
2. 阿里云接口集成
3. 用户认证和授权
4. 支付接口对接
5. 性能优化

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
