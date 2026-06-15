# Video Subtitle Remover - 后端服务

微信小程序「牛马去字幕」的后端 API 服务。

## 技术栈

- **运行环境**: Node.js 18+
- **框架**: Express
- **数据库**: MySQL 8.0 + Redis 7.0
- **认证**: JWT (jsonwebtoken)
- **文件上传**: Multer + 阿里云 OSS
- **支付**: 微信支付 SDK
- **任务队列**: Bull (Redis)

## 目录结构

```
server/
├── src/
│   ├── controllers/      # 控制器
│   ├── services/         # 业务逻辑层
│   ├── models/           # 数据模型层
│   ├── routes/           # 路由定义
│   ├── middleware/       # 中间件（认证、验证、错误处理、上传）
│   ├── utils/            # 工具函数（JWT、微信、支付、OSS）
│   ├── config/           # 配置（数据库、Redis、微信、OSS）
│   ├── app.js            # Express 应用入口
│   └── server.js         # 服务器启动
├── tests/                # 测试文件
├── uploads/              # 视频上传目录
├── .env.example          # 环境变量示例
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入真实配置
```

### 3. 初始化数据库

```bash
# 执行数据库初始化脚本
mysql -u root -p < ../database/init.sql
# 执行迁移脚本（新增表）
mysql -u root -p video_remover < src/config/migration.sql
```

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

### 5. 验证

```bash
curl http://localhost:3000/health
# 返回: {"status":"ok","timestamp":"..."}
```

## API 文档

完整 API 文档见 [API接口文档.md](../API接口文档.md)

| 模块 | 基础路径 | 说明 |
|------|----------|------|
| 认证 | `/v1/auth` | 微信登录、Token 刷新 |
| 用户 | `/v1/user` | 用户信息、统计 |
| 任务 | `/v1/tasks` | 任务 CRUD、进度查询 |
| 套餐 | `/v1/packages` | 套餐列表 |
| 订单 | `/v1/orders` | 订单 CRUD、支付回调 |
| 积分 | `/v1/points` | 积分余额、记录 |
| 通知 | `/v1/notifications` | 通知列表、已读 |
| 反馈 | `/v1/feedbacks` | 提交、列表 |
| 系统 | `/v1/system` | 系统配置 |
| 管理 | `/v1/admin` | 管理员统计 |

## 环境变量

见 `.env.example` 文件。

## 测试

```bash
npm test
```

## 部署

```bash
# 构建
npm ci --production

# 启动（使用 PM2）
pm2 start src/server.js --name video-remover-api
```
