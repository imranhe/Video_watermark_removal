# 后端 API 架构设计

## 概述

后端服务负责处理视频上传、任务管理、阿里云接口调用等核心功能。采用 Node.js + Express + Redis + MySQL 的技术栈。

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: MySQL 5.7.44
- **缓存/队列**: Redis
- **文件存储**: 阿里云 OSS
- **视频处理**: 阿里云 MPS

## 核心模块

### 1. 文件上传模块

#### 功能
- 分片上传支持
- 断点续传
- 文件合并
- 上传进度追踪

#### API 端点

```
POST /api/upload/init
- 初始化上传，返回 uploadId
- Body: { filename, fileSize, chunkSize }

POST /api/upload/chunk
- 上传单个分片
- Headers: X-Upload-Id, X-Chunk-Index
- Body: binary data

POST /api/upload/merge
- 合并所有分片
- Body: { uploadId, filename }

GET /api/upload/status/:uploadId
- 查询上传状态
- Response: { uploadedChunks, totalChunks }
```

#### 实现要点
- 使用 Redis 存储上传状态（uploadId -> uploadedChunks）
- 分片存储到临时目录，合并后上传到 OSS
- 并发控制：限制同时上传数量

### 2. 任务管理模块

#### 功能
- 任务创建和提交
- 任务状态查询
- 任务进度更新
- 任务重试机制

#### API 端点

```
POST /api/tasks/create
- 创建处理任务
- Body: { videoUrl, taskType, params }
- Response: Task object

GET /api/tasks/:id
- 查询任务状态
- Response: Task object with status and progress

GET /api/tasks/user/:userId
- 获取用户任务列表
- Query: { page, pageSize }

POST /api/tasks/:id/retry
- 重试失败任务

PUT /api/tasks/:id/cancel
- 取消任务

DELETE /api/tasks/:id
- 删除任务
```

#### 任务状态机

```
pending -> processing -> completed
                   \-> failed -> retrying -> processing
```

#### 数据库设计

```sql
CREATE TABLE tasks (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  result_url VARCHAR(500),
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  task_type ENUM('subtitle', 'icon') NOT NULL,
  params JSON,
  progress INT DEFAULT 0,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### 3. 阿里云 MPS 集成模块

#### 功能
- 提交视频处理任务
- 查询任务状态
- 回调处理

#### API 端点

```
POST /api/aliyun/submit-job
- 提交处理任务到阿里云
- Body: { videoUrl, processType, params, config }
- Response: { jobId, requestId }

GET /api/aliyun/query-job/:jobId
- 查询阿里云任务状态
- Response: { jobId, status, progress, outputUrl }

POST /api/aliyun/callback
- 阿里云任务完成回调
- Body: { jobId, status, outputUrl }
```

#### 实现要点

```typescript
// 使用阿里云 SDK
import { MPS } from '@alicloud/mps20180528';

const client = new MPS({
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  region: process.env.ALIYUN_REGION,
});

// 提交任务
async function submitJob(videoUrl: string, params: ProcessParams) {
  const request = new SubmitMediaProcessJobRequest({
    input: {
      bucket: process.env.INPUT_BUCKET,
      location: process.env.ALIYUN_REGION,
      object: videoUrl,
    },
    output: {
      bucket: process.env.OUTPUT_BUCKET,
      object: `output/${Date.now()}.mp4`,
    },
    processConfig: {
      // 去字幕配置
      subtitleRemoval: params.subtitleRegion,
      // 去水印配置
      removeWatermark: params.watermarkRegion,
    },
  });
  
  return await client.submitMediaProcessJob(request);
}
```

### 4. 实时推送模块

#### 功能
- SSE 实时状态推送
- 轮询降级支持

#### API 端点

```
GET /api/tasks/:id/stream
- SSE 实时状态流
- Response: text/event-stream

GET /api/tasks/:id/poll
- 轮询接口（降级方案）
- Response: Task object
```

#### SSE 实现

```typescript
import express from 'express';
import { EventEmitter } from 'events';

const taskEmitter = new EventEmitter();

app.get('/api/tasks/:id/stream', (req, res) => {
  const taskId = req.params.id;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const listener = (task: any) => {
    res.write(`data: ${JSON.stringify(task)}\n\n`);
  };
  
  taskEmitter.on(`task:${taskId}`, listener);
  
  req.on('close', () => {
    taskEmitter.off(`task:${taskId}`, listener);
  });
});

// 任务状态更新时触发事件
function updateTaskStatus(taskId: string, status: any) {
  taskEmitter.emit(`task:${taskId}`, status);
}
```

### 5. 限流和并发控制

#### 限流策略

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// API 限流
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 最多 100 次请求
  message: '请求过于频繁，请稍后再试',
});

// 任务创建限流（每用户）
const taskLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  windowMs: 60 * 1000, // 1 分钟
  max: 5, // 每分钟最多创建 5 个任务
  keyGenerator: (req) => req.user.id,
});
```

#### 并发控制

```typescript
// 使用 Redis 实现分布式锁
async function acquireLock(taskId: string, ttl: number = 300): Promise<boolean> {
  const result = await redis.set(
    `lock:task:${taskId}`,
    '1',
    'EX',
    ttl,
    'NX'
  );
  return result === 'OK';
}

// 任务队列并发限制
const taskQueue = new Bull('video-processing', {
  redis: { host: 'localhost', port: 6379 },
  limiter: {
    max: 10, // 最大并发数
    duration: 1000,
  },
});
```

## 目录结构

```
backend/
├── src/
│   ├── controllers/
│   │   ├── upload.controller.ts
│   │   ├── task.controller.ts
│   │   └── aliyun.controller.ts
│   ├── services/
│   │   ├── upload.service.ts
│   │   ├── task.service.ts
│   │   └── aliyun.service.ts
│   ├── models/
│   │   └── task.model.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rateLimiter.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── upload.routes.ts
│   │   ├── task.routes.ts
│   │   └── aliyun.routes.ts
│   ├── utils/
│   │   ├── redis.ts
│   │   ├── oss.ts
│   │   └── logger.ts
│   └── app.ts
├── config/
│   ├── default.ts
│   └── production.ts
├── package.json
└── tsconfig.json
```

## 环境变量

```bash
# 服务器配置
NODE_ENV=development
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=video_remover

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 阿里云配置
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_REGION=cn-hangzhou
ALIYUN_INPUT_BUCKET=your_input_bucket
ALIYUN_OUTPUT_BUCKET=your_output_bucket

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600  # 100MB
CHUNK_SIZE=2097152      # 2MB
```

## 部署建议

1. **开发环境**: Docker Compose 一键启动
2. **生产环境**: 
   - 使用 PM2 管理 Node.js 进程
   - Nginx 反向代理
   - MySQL 主从复制
   - Redis 哨兵模式
   - 阿里云 ECS 或容器服务

## 监控和日志

- 使用 Winston 记录日志
- 集成 Sentry 错误追踪
- Prometheus + Grafana 监控
