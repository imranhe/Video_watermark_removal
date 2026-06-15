# 故障排除指南

本文档整理了视频去字幕小程序开发和运行过程中常见的问题及解决方案。

---

## 目录

1. [环境配置问题](#1-环境配置问题)
2. [依赖安装问题](#2-依赖安装问题)
3. [运行时错误](#3-运行时错误)
4. [数据库连接问题](#4-数据库连接问题)
5. [Redis 连接问题](#5-redis-连接问题)
6. [阿里云接口问题](#6-阿里云接口问题)
7. [多端兼容性问题](#7-多端兼容性问题)
8. [性能问题](#8-性能问题)

---

## 1. 环境配置问题

### 1.1 Node.js 版本不兼容

**症状**:
```
Error: The engine "node" is incompatible with this module
```

**原因**: 项目要求 Node.js 18+，当前版本过低。

**解决方案**:
```bash
# 查看当前版本
node -v

# 使用 nvm 切换版本
nvm install 18
nvm use 18

# 或使用 fnm
fnm install 18
fnm use 18
```

### 1.2 环境变量未加载

**症状**: API 请求使用了默认值（如 `http://localhost:3000`），无法连接后端服务。

**解决方案**:
```bash
# 检查 .env 文件是否存在
cat .env.local

# 创建环境变量文件
cat > .env.local << 'EOF'
VITE_API_BASE=http://your-api-host:3000
VITE_ALIYUN_REGION=cn-hangzhou
EOF
```

**注意**: Vite 环境变量必须以 `VITE_` 开头才能在前端代码中通过 `import.meta.env` 访问。

### 1.3 TypeScript 编译错误

**症状**:
```
error TS2307: Cannot find module '@/xxx' or its corresponding type declarations
```

**解决方案**:
```bash
# 检查 tsconfig.json 路径别名配置
cat tsconfig.json

# 确认 paths 配置包含 @ 别名
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# 运行类型检查
npm run type-check
```

### 1.4 Docker 环境问题

**症状**: Docker Compose 启动失败。

**解决方案**:
```bash
# 检查 Docker 服务状态
docker info

# 查看容器日志
docker-compose logs -f

# 重建容器
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**常见原因**:
- 端口冲突（3306、3000、80）: 修改 `docker-compose.yml` 中的端口映射
- 数据卷权限: 确保 `mysql_data` 卷有写权限
- 内存不足: MySQL 5.7 至少需要 1GB 内存

---

## 2. 依赖安装问题

### 2.1 npm install 失败

**症状**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
```

**解决方案**:
```bash
# 使用 --legacy-peer-deps
npm install --legacy-peer-deps

# 或清除缓存后重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 或使用 yarn
yarn install
```

### 2.2 uni-App 依赖缺失

**症状**:
```
Error: Cannot find module '@dcloudio/vite-plugin-uni'
```

**解决方案**:
```bash
# 确认 @dcloudio 相关包已安装
npm ls @dcloudio/vite-plugin-uni

# 重新安装
npm install @dcloudio/vite-plugin-uni@3.0.0-4080420251103001
```

### 2.3 node_modules 权限问题

**症状**:
```
EACCES: permission denied
```

**解决方案**:
```bash
# 修复 npm 全局目录权限
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ./node_modules

# 不建议使用 sudo npm install
```

### 2.4 后端依赖安装失败

**症状**: 阿里云 SDK 或 Redis 客户端安装失败。

**解决方案**:
```bash
# 安装阿里云 SDK
npm install @alicloud/mps20180528 @alicloud/openapi-client

# 安装 Redis 客户端
npm install redis

# 安装 Bull 任务队列
npm install bull
```

---

## 3. 运行时错误

### 3.1 开发服务器启动失败

**症状**:
```
Error: listen EADDRINUSE: address already in use :::5173
```

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :5173

# 终止占用进程
kill -9 <PID>

# 或使用不同端口启动
npx uni --port 5174
```

### 3.2 页面空白 / 白屏

**症状**: 浏览器打开后页面为空白。

**排查步骤**:
1. 打开浏览器控制台（F12），查看是否有 JavaScript 错误
2. 检查路由配置是否正确（`src/pages.json` 或 `pages` 配置）
3. 确认入口页面路径是否正确

**常见原因**:
- `src/pages.json` 未配置页面路由
- 组件导入路径错误
- 运行时异常未捕获

### 3.3 uni.request 请求失败

**症状**: API 请求返回网络错误。

**排查步骤**:
```typescript
// 检查 API_BASE 配置
console.log('API_BASE:', import.meta.env.VITE_API_BASE);

// 检查后端服务是否运行
// H5 端直接在浏览器访问后端地址
// 小程序端检查合法域名配置
```

**小程序端特别注意**:
- 微信小程序需要在管理后台配置合法域名
- 支付宝小程序需要在开放平台配置白名单
- 开发阶段可在开发工具中勾选"不校验合法域名"

### 3.4 Token 失效 / 401 错误

**症状**: 请求返回 401，页面自动跳转到登录页。

**原因**: JWT Token 过期或无效。

**解决方案**:
```typescript
// 检查本地存储的 Token
console.log('Token:', uni.getStorageSync('access_token'));

// 清除旧 Token 并重新登录
uni.removeStorageSync('access_token');
```

### 3.5 Vue 组件渲染错误

**症状**: 控制台报 `Component is missing template or render function`。

**解决方案**:
- 确认 `.vue` 文件包含 `<template>` 标签
- 检查组件导入路径是否正确
- 确认 `<script setup lang="ts">` 语法正确

---

## 4. 数据库连接问题

### 4.1 MySQL 连接被拒绝

**症状**:
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**排查步骤**:

```bash
# 1. 检查 MySQL 服务是否运行
# Docker 环境
docker ps | grep mysql

# 本地安装
sudo systemctl status mysql   # Linux
brew services list | grep mysql  # macOS

# 2. 检查连接配置
echo $DB_HOST $DB_PORT $DB_USER $DB_NAME

# 3. 手动测试连接
mysql -h 127.0.0.1 -P 3306 -u root -p video_remover

# 4. 检查 Docker 网络
docker network ls
docker network inspect video-watermark-removal_app-network
```

### 4.2 认证失败

**症状**:
```
Error: Access denied for user 'root'@'localhost' (using password: YES)
```

**解决方案**:
```bash
# 确认密码是否正确
# docker-compose.yml 中 MYSQL_ROOT_PASSWORD 与后端 DB_PASSWORD 必须一致

# Docker 环境重置密码
docker-compose down -v  # 删除数据卷
docker-compose up -d    # 重新创建
```

### 4.3 数据库不存在

**症状**:
```
Error: Unknown database 'video_remover'
```

**解决方案**:
```bash
# 手动创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS video_remover CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 或重新初始化（Docker）
docker-compose down -v
docker-compose up -d
# init.sql 会自动执行
```

### 4.4 字符编码问题

**症状**: 中文数据显示为乱码。

**解决方案**:
```sql
-- 检查数据库编码
SHOW VARIABLES LIKE 'character_set%';

-- 确保使用 utf8mb4
ALTER DATABASE video_remover CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 连接时指定编码
SET NAMES utf8mb4;
```

**后端连接配置**:
```typescript
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  charset: 'utf8mb4',
  // ...
});
```

---

## 5. Redis 连接问题

### 5.1 Redis 连接被拒绝

**症状**:
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**排查步骤**:
```bash
# 1. 检查 Redis 服务是否运行
redis-cli ping
# 预期输出: PONG

# Docker 环境
docker ps | grep redis

# 2. 检查端口是否可达
telnet localhost 6379

# 3. 检查 Redis 配置
cat /etc/redis/redis.conf | grep -E "^(bind|port|requirepass)"
```

**解决方案**:
```bash
# 启动 Redis
# macOS (Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 5.2 Redis 认证失败

**症状**:
```
Error: NOAUTH Authentication required
```

**解决方案**:
```bash
# 确认 Redis 密码配置
# 后端 .env 文件中
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 测试带密码连接
redis-cli -a your_redis_password ping
```

### 5.3 Redis 内存不足

**症状**:
```
OOM command not allowed when used memory > 'maxmemory'
```

**解决方案**:
```bash
# 查看 Redis 内存使用
redis-cli info memory

# 增加最大内存限制
redis-cli CONFIG SET maxmemory 256mb

# 设置淘汰策略
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 5.4 Bull 队列任务堆积

**症状**: 任务提交后长时间处于 `pending` 状态。

**排查步骤**:
```bash
# 检查队列状态
redis-cli llen bull:video-processing:wait
redis-cli llen bull:video-processing:active
redis-cli llen bull:video-processing:failed

# 检查 Worker 是否运行
# 确认后端服务正常启动且 Worker 进程活跃
```

**解决方案**:
- 确认后端 Worker 进程正常运行
- 检查任务处理函数是否有异常
- 查看 Redis 中任务数据是否损坏

---

## 6. 阿里云接口问题

### 6.1 AccessKey 配置错误

**症状**:
```
InvalidAccessKeyId.NotFound: The AccessKey ID does not exist
```

**排查步骤**:
```bash
# 检查环境变量
echo $ALIYUN_ACCESS_KEY_ID
echo $ALIYUN_ACCESS_KEY_SECRET

# 检查 .env 文件中的配置
cat .env | grep ALIYUN
```

**解决方案**:
1. 登录阿里云控制台 -> AccessKey 管理
2. 确认 AccessKey ID 和 Secret 正确
3. 确认 AccessKey 状态为"启用"
4. **安全建议**: 不要在前端代码中暴露 AccessKey，通过后端代理调用

### 6.2 MPS 服务未开通

**症状**:
```
Forbidden: User not authorized to operate the specified resource
```

**解决方案**:
1. 登录阿里云控制台
2. 搜索"媒体处理 MPS"
3. 开通服务并同意服务协议
4. 授权 RAM 用户 MPS 访问权限

### 6.3 OSS Bucket 配置错误

**症状**:
```
NoSuchBucket: The specified bucket does not exist
```

**解决方案**:
```bash
# 确认 Bucket 名称
echo $ALIYUN_INPUT_BUCKET
echo $ALIYUN_OUTPUT_BUCKET

# 确认 Bucket 存在且位于正确的 Region
# 确认 Bucket ACL 权限设置
```

**注意事项**:
- 输入 Bucket 和输出 Bucket 必须在同一个 Region
- 确保 RAM 用户有 Bucket 的读写权限
- Bucket 名称全局唯一，确认无拼写错误

### 6.4 视频处理任务失败

**症状**: 任务状态变为 `failed`，返回错误信息。

**常见原因及解决方案**:

| 错误信息                    | 原因                     | 解决方案                        |
|-----------------------------|--------------------------|---------------------------------|
| `InvalidParameter`          | 参数格式错误              | 检查区域坐标是否为 0-1 归一化值 |
| `InvalidVideo`              | 视频格式不支持            | 使用 MP4/MOV 格式              |
| `FileSizeLimitExceeded`     | 文件超过大小限制          | 阿里云 MPS 单文件限制参考官方文档 |
| `Throttling`                | 请求频率过高              | 降低提交频率，添加重试机制     |

### 6.5 回调通知未收到

**症状**: 视频处理完成后，任务状态未自动更新。

**排查步骤**:
1. 检查回调 URL 配置是否正确
2. 确认回调 URL 可公网访问
3. 检查回调接口返回状态码是否为 200
4. 查看阿里云 MPS 控制台的回调日志

**解决方案**:
- 使用 ngrok 等工具将本地服务暴露到公网（开发阶段）
- 后端添加兜底轮询机制，定期查询阿里云任务状态

---

## 7. 多端兼容性问题

### 7.1 微信小程序视频选择失败

**症状**: `uni.chooseMedia` 调用失败。

**解决方案**:
```typescript
// 确认使用正确的 API（chooseMedia 而非 chooseVideo）
uni.chooseMedia({
  count: 1,
  mediaType: ['video'],
  sourceType: ['album', 'camera'],
  maxDuration: 60,
  success: (res) => { /* ... */ },
  fail: (err) => {
    console.error('选择失败:', err);
    // 常见错误码：
    // fail:cancel - 用户取消
    // fail:system permission denied - 未授权相册/相机权限
  },
});
```

**常见原因**:
- 未在 `app.json` 中声明相册和相机权限
- 用户拒绝了权限请求
- 基础库版本过低

### 7.2 支付宝小程序 API 差异

**症状**: `my.chooseVideo` 返回的数据结构与微信不同。

**适配方案**:
```typescript
// 使用条件编译处理差异
// #ifdef MP-WEIXIN
const res = await uni.chooseMedia({ /* 微信参数 */ });
const video = res.tempFiles[0];
// #endif

// #ifdef MP-ALIPAY
const res = await my.chooseVideo({ /* 支付宝参数 */ });
const video = {
  path: res.tempFilePath,
  size: res.size,
  duration: res.duration,
};
// #endif
```

### 7.3 H5 端文件大小获取

**症状**: H5 端 `file.size` 返回 0 或 undefined。

**解决方案**:
```typescript
// 使用 File API 正确获取
const input = document.createElement('input');
input.type = 'file';
input.accept = 'video/*';
input.onchange = (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    console.log('文件大小:', file.size); // 字节
    console.log('文件类型:', file.type); // MIME 类型
  }
};
```

### 7.4 小程序分片上传限制

**症状**: 大文件上传时内存溢出或超时。

**原因**: 小程序对单次请求大小和内存有严格限制。

**解决方案**:
- 使用较小的分片大小（建议 1-2MB）
- 逐片上传，不要并发上传（小程序并发请求限制为 10 个）
- 使用 `uni.getFileSystemManager().readFile` 的 `position` 和 `length` 参数读取分片

### 7.5 SSE 在小程序端不支持

**症状**: `EventSource` API 在小程序中不可用。

**解决方案**: `useTaskPoller` 已内置降级机制：
- 检测到 `EventSource` 不可用时自动切换为定时轮询
- 轮询间隔默认 3 秒（可通过 `interval` 参数配置）
- 最大重试次数默认 5 次

### 7.6 CSS 样式差异

**症状**: 同一样式在不同平台显示不一致。

**常见差异**:
- `rpx` 在 H5 端不生效，使用 `px` 或 `rem`
- 部分 CSS3 属性（如 `backdrop-filter`）在小程序中不支持
- `position: fixed` 在某些小程序中行为异常

**解决方案**:
```css
/* 使用条件编译处理平台差异 */
/* #ifdef H5 */
.element {
  position: sticky;
  top: 0;
}
/* #endif */

/* #ifdef MP-WEIXIN || MP-ALIPAY */
.element {
  position: fixed;
  top: 0;
}
/* #endif */
```

---

## 8. 性能问题

### 8.1 首屏加载缓慢

**目标**: H5 首屏加载 < 3 秒。

**排查步骤**:
```bash
# 构建分析
npm run build:h5

# 检查构建产物大小
du -sh dist/

# 使用 Vite 分析插件
npx vite-bundle-visualizer
```

**优化方案**:
```typescript
// 1. 路由懒加载
const Upload = () => import('@/pages/upload/upload.vue');

// 2. 组件按需导入
import { ref } from 'vue'; // 按需引入

// 3. 图片压缩和 CDN
// 使用阿里云 OSS 的图片处理功能

// 4. Vite 构建优化 (vite.config.ts)
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'pinia'],
        },
      },
    },
  },
});
```

### 8.2 视频上传速度慢

**排查步骤**:
1. 检查网络带宽
2. 检查分片大小是否合理
3. 检查是否支持并发上传

**优化方案**:
```typescript
// 1. 调整分片大小（网络好时增大）
useVideoUpload({ chunkSize: 5 }); // 5MB

// 2. 并发上传（H5 端）
// 当前实现为顺序上传，可改为并发
const CONCURRENT_LIMIT = 3;
await Promise.all(
  chunks.slice(0, CONCURRENT_LIMIT).map(chunk => uploadChunk(chunk))
);

// 3. 开启 Gzip 压缩（Nginx 配置）
// gzip on;
// gzip_types application/octet-stream;
```

### 8.3 任务轮询性能问题

**症状**: 多任务同时轮询导致网络请求过多。

**优化方案**:
```typescript
// 1. 使用 SSE 替代轮询（自动降级为轮询）
const poller = useTaskPoller({ useSSE: true, interval: 3000 });

// 2. 页面不可见时暂停轮询
onPageHide(() => poller.pausePolling());
onPageShow(() => poller.resumePolling(taskId, onStatusChange));

// 3. 任务完成/失败后立即停止轮询（已内置）
```

### 8.4 内存泄漏

**症状**: 长时间使用后页面卡顿或崩溃。

**常见原因**:
- 未在组件卸载时清理定时器
- 未在组件卸载时关闭 SSE 连接
- 视频 Blob URL 未释放

**解决方案**:
```typescript
// 1. useTaskPoller 已内置 onUnmounted 清理
// 2. 视频预览 URL 使用后释放
onUnmounted(() => {
  if (videoPreviewUrl.value) {
    URL.revokeObjectURL(videoPreviewUrl.value);
  }
});

// 3. 定时器清理
const timer = setInterval(poll, 3000);
onUnmounted(() => clearInterval(timer));
```

### 8.5 数据库查询缓慢

**症状**: 任务列表接口响应慢。

**排查步骤**:
```sql
-- 检查慢查询日志
SHOW VARIABLES LIKE 'slow_query_log%';

-- 分析查询计划
EXPLAIN SELECT * FROM tasks WHERE user_id = 'xxx' ORDER BY created_at DESC;
```

**优化方案**:
```sql
-- 确保索引存在
CREATE INDEX idx_user_created ON tasks(user_id, created_at DESC);

-- 分页查询优化（避免 offset）
-- 不推荐: SELECT * FROM tasks LIMIT 20 OFFSET 1000
-- 推荐: SELECT * FROM tasks WHERE id > 'last_id' LIMIT 20
```

### 8.6 Redis 缓存策略

**优化建议**:
```
# 缓存任务状态（TTL 5 分钟）
SET task:status:{taskId} '{"status":"processing","progress":50}' EX 300

# 缓存用户信息（TTL 10 分钟）
SET user:info:{userId} '{"balance":100}' EX 600

# 上传状态缓存（TTL 1 小时）
SET upload:status:{fileId} '{"chunks":[0,1,2]}' EX 3600
```

---

## 附录: 快速诊断命令

```bash
# 环境检查
node -v && npm -v
docker --version && docker-compose --version

# 服务状态
docker-compose ps
curl -s http://localhost:3000/health  # 后端健康检查
redis-cli ping                         # Redis 连接
mysql -u root -p -e "SELECT 1"         # MySQL 连接

# 日志查看
docker-compose logs -f backend
docker-compose logs -f mysql

# 项目检查
npm run type-check                     # TypeScript 类型检查
bash .claude/scripts/automation.sh     # 项目自动化检查
```
