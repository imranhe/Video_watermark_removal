# 🚀 快速启动指南

## 项目概览

视频去字幕小程序已完成 **Phase 1 和 Phase 2** 的开发，具备完整的视频上传、任务管理和阿里云接口对接能力。

---

## 📦 核心功能

### ✅ 已完成功能

1. **多端支持**
   - 微信小程序
   - 支付宝小程序
   - H5 网页端
   - App 端（可扩展）

2. **视频上传**
   - 分片上传（2MB/片）
   - 断点续传
   - 进度追踪
   - 暂停/恢复

3. **任务管理**
   - 实时状态推送（SSE）
   - 轮询降级机制
   - 任务重试
   - 进度显示

4. **阿里云集成**
   - MPS 视频处理接口
   - 去字幕功能
   - 去水印功能
   - 异步任务处理

---

## 🛠️ 开发环境启动

### 前端启动

```bash
# 进入项目目录
cd video-subtitle-remover

# 安装依赖
npm install

# H5 端开发
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin

# 支付宝小程序开发
npm run dev:mp-alipay
```

### 后端启动（待实现）

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入配置

# 启动开发服务器
npm run dev

# 或使用 Docker
docker-compose up -d
```

---

## 📁 项目结构

```
video-subtitle-remover/
├── src/
│   ├── api/                 # API 接口
│   │   ├── request.ts       # 网络请求工具
│   │   ├── aliyun.ts        # 阿里云接口
│   │   └── task.ts          # 任务接口
│   ├── components/          # 组件
│   │   ├── VideoUploader.vue
│   │   └── TaskStatus.vue
│   ├── pages/               # 页面
│   ├── store/               # 状态管理
│   │   ├── user.ts
│   │   ├── task.ts
│   │   └── order.ts
│   ├── types/               # TypeScript 类型
│   ├── utils/               # 工具函数
│   │   ├── upload.ts        # 视频上传工具
│   │   └── poller.ts        # 任务轮询工具
│   └── pages.json           # 路由配置
├── database/                # 数据库脚本
├── Dockerfile               # Docker 配置
├── docker-compose.yml       # Docker Compose
├── BACKEND_ARCHITECTURE.md  # 后端架构文档
└── .env.example             # 环境变量示例
```

---

## 🔧 配置说明

### 环境变量配置

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

主要配置项：

```bash
# 服务器
NODE_ENV=development
PORT=3000

# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=video_remover

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 阿里云
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_REGION=cn-hangzhou
```

### 数据库初始化

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
source database/init.sql
```

---

## 🎯 开发工作流

### 1. 前端开发

```bash
# 启动 H5 开发服务器
npm run dev:h5

# 访问 http://localhost:5173
# 修改代码后自动热重载
```

### 2. 微信小程序开发

```bash
# 编译微信小程序
npm run dev:mp-weixin

# 使用微信开发者工具打开
# dist/dev/mp-weixin 目录
```

### 3. 后端开发

```bash
# 启动后端服务
cd backend
npm run dev

# 启动 Redis
redis-server

# 启动 MySQL
mysql.server start
```

---

## 📚 核心模块说明

### 1. 视频上传 (`src/utils/upload.ts`)

```typescript
import { useVideoUpload } from '@/utils/upload';

const {
  selectVideo,
  startUpload,
  pauseUpload,
  resumeUpload,
  progress,
  status,
} = useVideoUpload({
  maxFileSize: 100,  // 最大 100MB
  chunkSize: 2,      // 分片 2MB
});

// 选择视频
const video = await selectVideo();

// 开始上传
await startUpload();
```

### 2. 任务轮询 (`src/utils/poller.ts`)

```typescript
import { useTaskPoller } from '@/utils/poller';

const { startPolling, stopPolling } = useTaskPoller({
  interval: 3000,
  useSSE: true,
});

// 开始轮询
startPolling(
  taskId,
  (task) => {
    console.log('任务状态:', task.status, task.progress);
  },
  (error) => {
    console.error('轮询失败:', error);
  }
);
```

### 3. 阿里云接口 (`src/api/aliyun.ts`)

```typescript
import { mpsClient } from '@/api/aliyun';

// 提交去字幕任务
const { jobId } = await mpsClient.submitJob(
  videoUrl,
  'subtitle',
  {
    subtitleRegion: {
      x: 0,
      y: 0.9,
      width: 1,
      height: 0.1,
    },
  }
);

// 查询任务状态
const task = await mpsClient.queryJob(jobId);
```

---

## 🧪 测试

### 单元测试

```bash
# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

### E2E 测试

```bash
# 运行 E2E 测试
npm run test:e2e
```

---

## 🚢 部署

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产环境部署

```bash
# 构建生产版本
npm run build:h5

# 上传到服务器
scp -r dist/h5/* user@server:/var/www/html/

# 配置 Nginx
# 参考 nginx.conf 配置文件
```

---

## 📖 文档列表

1. **README.md** - 项目概览和快速开始
2. **BACKEND_ARCHITECTURE.md** - 后端架构设计
3. **PHASE2_COMPLETE.md** - Phase 2 完成报告
4. **PROJECT_STATUS.md** - 项目状态报告
5. **QUICKSTART.md** - 快速启动指南（本文档）

---

## 🎓 学习资源

### uni-App 文档
- [官方文档](https://uniapp.dcloud.net.cn/)
- [Vue3 组合式 API](https://vuejs.org/guide/extras/composition-api-faq.html)

### 阿里云 MPS
- [媒体处理 MPS 文档](https://help.aliyun.com/product/29932.html)
- [API Explorer](https://api.aliyun.com/)

### TypeScript
- [TypeScript 手册](https://www.typescriptlang.org/docs/handbook/)

---

## ❓ 常见问题

### 1. 微信小程序无法上传大文件

**问题**: 微信小程序限制单次上传 10MB

**解决**: 使用分片上传功能，已内置支持

### 2. SSE 连接失败

**问题**: 某些环境不支持 SSE

**解决**: 系统自动降级为轮询模式，无需手动处理

### 3. 阿里云接口调用失败

**问题**: AccessKey 配置错误

**解决**: 
1. 检查 `.env` 文件中的 AccessKey 配置
2. 确保 RAM 用户有 MPS 访问权限
3. 检查网络连接

### 4. 任务状态不更新

**问题**: 轮询或 SSE 未正常工作

**解决**:
1. 检查后端服务是否正常运行
2. 检查 Redis 连接
3. 查看浏览器控制台日志

---

## 📞 获取帮助

- 查看文档：各 `.md` 文件
- 检查日志：控制台输出和后端日志
- 代码审查：各模块都有详细注释

---

## 🎉 下一步

项目已完成核心功能开发，可以：

1. **继续开发 Phase 3**: 用户系统（登录、注册、权限）
2. **开发后端**: 实现后端 API 服务
3. **测试验证**: 进行功能测试和集成测试
4. **部署上线**: 部署到生产环境

**选择你的下一步，开始构建完整的产品！** 🚀
