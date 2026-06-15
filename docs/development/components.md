# 组件文档

本文档描述视频去字幕小程序的核心前端组件，包括 Props、Events、使用示例和多端适配说明。

技术栈：uni-App (Vue 3 + TypeScript + Vite) + Pinia

---

## 目录

1. [VideoUploader（视频上传组件）](#1videouploader视频上传组件)
2. [TaskStatus（任务状态组件）](#2taskstatus任务状态组件)
3. [useVideoUpload（视频上传 Composable）](#3usevideoupload视频上传-composable)
4. [useTaskPoller（任务轮询 Composable）](#4usetaskpoller任务轮询-composable)
5. [AliyunMPSClient（阿里云 MPS 客户端）](#5aliyunmpsclient阿里云-mps-客户端)
6. [Store 模块](#6store-模块)

---

## 1.VideoUploader（视频上传组件）

**文件路径**: `src/components/VideoUploader.vue`

视频上传组件，支持视频选择、预览、分片上传、进度追踪、暂停/恢复、断点续传功能。

### Props

| Prop        | 类型      | 默认值  | 说明                              |
|-------------|-----------|---------|-----------------------------------|
| `maxSize`   | `number`  | `100`   | 最大文件大小，单位 MB             |
| `autoUpload`| `boolean` | `false` | 选择视频后是否自动开始上传        |

### Events

| Event             | 回调参数类型          | 说明                                 |
|-------------------|-----------------------|--------------------------------------|
| `select`          | `VideoInfo`           | 用户选择视频后触发，返回视频信息对象 |
| `upload-start`    | 无                    | 上传开始时触发                       |
| `upload-progress` | `UploadProgress`      | 上传进度更新时触发                   |
| `upload-success`  | `UploadResult`        | 上传成功时触发                       |
| `upload-error`    | `string`              | 上传失败时触发，参数为错误信息       |

### VideoInfo 类型

```typescript
interface VideoInfo {
  path: string;          // 视频文件路径
  size: number;          // 文件大小（字节）
  duration: number;      // 视频时长（秒）
  width: number;         // 视频宽度（像素）
  height: number;        // 视频高度（像素）
  tempFilePath?: string; // 临时文件路径（小程序端特有）
}
```

### UploadProgress 类型

```typescript
interface UploadProgress {
  loaded: number;        // 已上传大小（字节）
  total: number;         // 总大小（字节）
  percent: number;       // 进度百分比 (0-100)
  speed: number;         // 上传速度（字节/秒）
  remainingTime: number; // 预计剩余时间（秒）
}
```

### UploadResult 类型

```typescript
interface UploadResult {
  success: boolean;
  fileId?: string;     // 文件唯一标识
  videoUrl?: string;   // 上传后的视频 URL
  error?: string;
}
```

### 使用示例

```vue
<template>
  <VideoUploader
    :max-size="200"
    :auto-upload="false"
    @select="onVideoSelect"
    @upload-start="onUploadStart"
    @upload-progress="onUploadProgress"
    @upload-success="onUploadSuccess"
    @upload-error="onUploadError"
  />
</template>

<script setup lang="ts">
import VideoUploader from '@/components/VideoUploader.vue';

function onVideoSelect(video: any) {
  console.log('选中视频:', video.path, '大小:', video.size);
}

function onUploadStart() {
  console.log('开始上传');
}

function onUploadProgress(progress: any) {
  console.log(`上传进度: ${progress.percent}%, 速度: ${progress.speed}`);
}

function onUploadSuccess(result: any) {
  console.log('上传成功, fileId:', result.fileId);
}

function onUploadError(error: string) {
  console.error('上传失败:', error);
}
</script>
```

### 内部状态机

```
idle -> selecting -> idle (选择完成)
idle -> uploading -> completed (上传成功)
idle -> uploading -> failed (上传失败)
uploading <-> paused (暂停/恢复)
```

### 多端适配说明

| 平台           | 视频选择方式                          | 上传方式                                | 备注                       |
|----------------|---------------------------------------|-----------------------------------------|----------------------------|
| **微信小程序** | `uni.chooseMedia`                     | `uni.getFileSystemManager` 分片读取     | 支持相册和相机来源         |
| **支付宝小程序** | `my.chooseVideo`                    | `uni.request`                           | 支持相册和相机来源         |
| **H5**         | `<input type="file">` + `URL.createObjectURL` | `XMLHttpRequest` 分片上传     | 使用 Blob API 读取分片     |
| **App**        | `uni.chooseVideo`                     | `uni.request`                           | 通过 uni 编译条件处理      |

**关键适配细节**:
- 使用 `// #ifdef MP-WEIXIN` 等条件编译指令区分平台
- H5 端通过 `URL.createObjectURL` 生成视频预览路径
- 小程序端通过 `tempFilePath` 访问临时文件
- 分片大小默认 2MB，支持断点续传（通过 `uploadedChunks` Set 记录已上传分片）
- 最大重试次数默认 3 次

---

## 2.TaskStatus（任务状态组件）

**文件路径**: `src/components/TaskStatus.vue`

任务状态展示组件，显示任务的处理状态、进度、结果下载和错误重试功能。

### Props

| Prop           | 类型                  | 默认值         | 说明                                  |
|----------------|-----------------------|----------------|---------------------------------------|
| `taskId`       | `string`              | (必填)         | 任务唯一标识                          |
| `status`       | `TaskStatus`          | (必填)         | 任务状态                              |
| `taskType`     | `'subtitle' \| 'icon'`| (必填)         | 任务类型：去除字幕 或 去除图标        |
| `progress`     | `number`              | `0`            | 处理进度百分比 (0-100)                |
| `createdAt`    | `string`              | (必填)         | 任务创建时间（ISO 8601 格式）         |
| `completedAt`  | `string`              | `undefined`    | 任务完成时间（ISO 8601 格式）         |
| `errorMessage` | `string`              | `'处理失败'`   | 错误信息                              |
| `videoDuration`| `number`              | `0`            | 视频时长（秒）                        |
| `resultUrl`    | `string`              | `''`           | 处理结果的下载 URL                    |

### TaskStatus 类型

```typescript
type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
```

### Events

| Event    | 回调参数类型 | 说明                                   |
|----------|-------------|----------------------------------------|
| `download`| `string`   | 用户点击下载时触发，参数为结果 URL     |
| `retry`  | `string`   | 用户点击重试时触发，参数为任务 ID      |

### 状态流转说明

```
pending (等待处理中)
  |
  v
processing (正在处理)
  |
  +-----> completed (处理完成) -----> 用户可下载结果
  |
  +-----> failed (处理失败) -----> 用户可重试
```

**状态样式映射**:

| 状态         | 左边框颜色 | 图标 | 可执行操作        |
|--------------|-----------|------|-------------------|
| `pending`    | 黄色(#faad14) | 等待图标 | 无            |
| `processing` | 蓝色(#1890ff) | 齿轮图标 | 无            |
| `completed`  | 绿色(#52c41a) | 成功图标 | 下载视频      |
| `failed`     | 红色(#ff4d4f) | 失败图标 | 重新处理      |

### 使用示例

```vue
<template>
  <TaskStatus
    :task-id="task.id"
    :status="task.status"
    :task-type="task.taskType"
    :progress="task.progress"
    :created-at="task.createdAt"
    :completed-at="task.completedAt"
    :error-message="task.errorMessage"
    :video-duration="task.videoDuration"
    :result-url="task.resultUrl"
    @download="handleDownload"
    @retry="handleRetry"
  />
</template>

<script setup lang="ts">
import TaskStatus from '@/components/TaskStatus.vue';
import { useTaskStore } from '@/store/task';

const taskStore = useTaskStore();
const task = computed(() => taskStore.currentTask);

function handleDownload(url: string) {
  console.log('下载结果:', url);
}

function handleRetry(taskId: string) {
  taskStore.retryTask(taskId);
}
</script>
```

### 多端下载适配

| 平台           | 下载方式                              |
|----------------|---------------------------------------|
| **H5**         | 创建 `<a>` 标签触发浏览器下载        |
| **微信小程序** | `uni.previewMedia` 预览视频          |
| **支付宝小程序** | `uni.previewMedia` 预览视频        |

---

## 3.useVideoUpload（视频上传 Composable）

**文件路径**: `src/utils/upload.ts`

视频上传的核心逻辑封装，以 Vue Composition API 形式提供，供 VideoUploader 组件使用。

### 配置参数

```typescript
interface UploadConfig {
  maxFileSize?: number;  // 最大文件大小（MB），默认 100
  chunkSize?: number;    // 分片大小（MB），默认 2
  maxRetries?: number;   // 最大重试次数，默认 3
}
```

### 返回值

```typescript
// 状态
status: Ref<UploadStatus>;       // 'idle' | 'selecting' | 'uploading' | 'paused' | 'completed' | 'failed'
videoInfo: Ref<VideoInfo | null>; // 当前视频信息
progress: Ref<UploadProgress>;   // 上传进度
error: Ref<string | null>;       // 错误信息
fileId: Ref<string | null>;      // 文件唯一标识

// 计算属性
isUploading: ComputedRef<boolean>;
isPaused: ComputedRef<boolean>;
isCompleted: ComputedRef<boolean>;
hasError: ComputedRef<boolean>;

// 方法
selectVideo(): Promise<VideoInfo | null>;  // 选择视频
startUpload(): Promise<UploadResult>;      // 开始上传
pauseUpload(): void;                       // 暂停上传
resumeUpload(): void;                      // 恢复上传
reset(): void;                             // 重置状态
```

### 上传流程

1. `selectVideo()` - 根据平台调用不同的视频选择 API
2. 验证文件大小是否超过 `maxFileSize` 限制
3. `startUpload()` - 生成文件 ID，初始化分片信息
4. 逐片上传，支持暂停/恢复（通过状态机控制）
5. 已上传分片自动跳过（断点续传）
6. 所有分片上传完成后调用合并接口

### API 端点

| 端点                          | 方法   | 说明           |
|-------------------------------|--------|----------------|
| `/api/upload/chunk`           | `POST` | 上传单个分片   |
| `/api/upload/merge`           | `POST` | 合并分片       |

---

## 4.useTaskPoller（任务轮询 Composable）

**文件路径**: `src/utils/poller.ts`

任务状态轮询工具，优先使用 SSE (Server-Sent Events) 实时推送，失败时自动降级为定时轮询。

### 配置参数

```typescript
interface PollingConfig {
  interval?: number;    // 轮询间隔（毫秒），默认 5000
  maxRetries?: number;  // 最大重试次数，默认 5
  useSSE?: boolean;     // 是否使用 SSE，默认 true
}
```

### 返回值

```typescript
isPolling: Ref<boolean>;         // 是否正在轮询
currentTaskId: Ref<string | null>; // 当前轮询的任务 ID
error: Ref<string | null>;       // 错误信息

startPolling(taskId, onStatusChange, onError?): void;  // 开始轮询
stopPolling(): void;             // 停止轮询
pausePolling(): void;            // 暂停轮询
resumePolling(taskId, onStatusChange, onError?): void; // 恢复轮询
```

### 轮询策略

1. **首选 SSE** - 连接 `/api/tasks/{taskId}/stream` 端点
2. **降级轮询** - SSE 失败或不支持时，以 `interval` 间隔轮询 `/api/tasks/{taskId}`
3. **自动停止** - 任务状态变为 `completed` 或 `failed` 时自动停止
4. **错误重试** - 轮询失败累计达 `maxRetries` 次后停止并报错
5. **生命周期管理** - 组件卸载时自动停止轮询

---

## 5.AliyunMPSClient（阿里云 MPS 客户端）

**文件路径**: `src/api/aliyun.ts`

阿里云媒体处理服务（MPS）客户端封装，支持视频去字幕和去水印功能。

### 配置

```typescript
interface AliyunConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;       // 默认 'cn-hangzhou'
  inputBucket: string;
  outputBucket: string;
}
```

环境变量:
- `VITE_ALIYUN_ACCESS_KEY_ID`
- `VITE_ALIYUN_ACCESS_KEY_SECRET`
- `VITE_ALIYUN_REGION`
- `VITE_ALIYUN_INPUT_BUCKET`
- `VITE_ALIYUN_OUTPUT_BUCKET`

### 方法

| 方法                        | 参数                                       | 返回值              | 说明                |
|-----------------------------|--------------------------------------------|---------------------|---------------------|
| `submitJob(videoUrl, type, params?)` | 视频 URL, 处理类型, 处理参数    | `SubmitJobResponse` | 提交视频处理任务    |
| `queryJob(jobId)`           | 任务 ID                                    | `TaskState`         | 查询单个任务状态    |
| `queryJobs(jobIds)`         | 任务 ID 数组                               | `TaskState[]`       | 批量查询任务状态    |

### 工具函数

```typescript
// 生成字幕区域参数
generateSubtitleRegion(
  videoWidth: number,
  videoHeight: number,
  position: 'bottom' | 'top' | 'custom',
  customRegion?: { x: number; y: number; width: number; height: number }
): ProcessParams;

// 生成水印区域参数
generateWatermarkRegion(
  videoWidth: number,
  videoHeight: number,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  size: { width: number; height: number }
): ProcessParams;
```

**注意**: 所有阿里云 API 调用通过后端代理，前端不直接暴露 AccessKey。

---

## 6.Store 模块

### 6.1 useTaskStore（任务状态管理）

**文件路径**: `src/store/task.ts`

**State**:

| 字段         | 类型           | 说明         |
|-------------|----------------|-------------|
| `tasks`     | `Task[]`       | 任务列表     |
| `currentTask`| `Task \| null` | 当前任务     |
| `isLoading` | `boolean`      | 加载状态     |
| `error`     | `string \| null`| 错误信息    |
| `isPolling` | `boolean`      | 轮询状态     |

**Getters**:

| Getter         | 类型       | 说明               |
|----------------|-----------|--------------------|
| `pendingTasks` | `Task[]`  | 等待中的任务列表   |
| `completedTasks`| `Task[]` | 已完成的任务列表   |
| `taskCount`    | `number`  | 任务总数           |

**Actions**:

| Action              | 参数                                    | 说明               |
|---------------------|-----------------------------------------|--------------------|
| `createTask`        | `videoUrl, taskType, params?`           | 创建处理任务       |
| `fetchTask`         | `taskId`                                | 获取任务详情       |
| `fetchUserTasks`    | `userId`                                | 获取用户任务列表   |
| `startPollingTask`  | `taskId`                                | 开始轮询任务状态   |
| `stopPollingTask`   | 无                                      | 停止轮询           |
| `setCurrentTask`    | `task \| null`                          | 设置当前任务       |
| `clearTasks`        | 无                                      | 清除所有任务       |

### 6.2 useUserStore（用户状态管理）

**文件路径**: `src/store/user.ts`

**State**:

| 字段         | 类型             | 说明         |
|-------------|------------------|-------------|
| `userInfo`  | `UserInfo \| null`| 用户信息     |
| `isLoading` | `boolean`        | 加载状态     |
| `error`     | `string \| null` | 错误信息     |

**Getters**:

| Getter       | 类型      | 说明       |
|-------------|-----------|-----------|
| `isLoggedIn`| `boolean` | 是否登录   |
| `balance`   | `number`  | 积分余额   |

**Actions**:

| Action         | 参数                     | 说明             |
|---------------|--------------------------|------------------|
| `login`       | `platform: 'wechat' \| 'alipay'` | 登录        |
| `setUserInfo` | `UserInfo`               | 设置用户信息     |
| `clearUser`   | 无                       | 清除用户信息     |

### 6.3 useOrderStore（订单状态管理）

**文件路径**: `src/store/order.ts`

**State**:

| 字段           | 类型              | 说明         |
|---------------|-------------------|-------------|
| `orders`      | `Order[]`         | 订单列表     |
| `currentOrder`| `Order \| null`   | 当前订单     |
| `isLoading`   | `boolean`         | 加载状态     |
| `error`       | `string \| null`  | 错误信息     |

**Getters**:

| Getter       | 类型      | 说明             |
|-------------|-----------|------------------|
| `paidOrders` | `Order[]` | 已支付订单列表   |
| `totalSpent` | `number`  | 累计消费金额     |

**Actions**:

| Action         | 参数                                      | 说明         |
|---------------|-------------------------------------------|-------------|
| `createOrder` | `amount, credits, platform`               | 创建订单     |
| `payOrder`    | `orderId`                                 | 支付订单     |
| `setCurrentOrder` | `Order \| null`                        | 设置当前订单 |
| `clearOrders` | 无                                        | 清除所有订单 |

---

## 7.API 模块

### 7.1 request（网络请求工具）

**文件路径**: `src/api/request.ts`

封装 `uni.request`，支持泛型类型推导、JWT Token 自动注入、错误处理。

**导出函数**:

| 函数          | 参数                           | 说明                     |
|---------------|-------------------------------|--------------------------|
| `get<T>`      | `url: string, data?: any`     | GET 请求                 |
| `post<T>`     | `url: string, data?: any`     | POST 请求                |
| `put<T>`      | `url: string, data?: any`     | PUT 请求                 |
| `del<T>`      | `url: string, data?: any`     | DELETE 请求              |
| `getToken`    | 无                             | 获取存储的 JWT Token     |
| `setToken`    | `token: string`               | 存储 JWT Token           |
| `clearToken`  | 无                             | 清除 JWT Token           |

**通用响应结构**:

```typescript
interface RequestResponse<T> {
  code: number;    // 业务状态码
  data: T;         // 响应数据
  message: string; // 提示信息
}
```

**错误处理**:
- 401 状态码自动清除 Token 并跳转登录页
- 网络错误返回 `{ code: -1, message: '网络连接失败' }`

### 7.2 task API

**文件路径**: `src/api/task.ts`

| 函数            | 参数                                       | 说明             |
|----------------|--------------------------------------------|------------------|
| `createTask`   | `CreateTaskParams`                         | 创建处理任务     |
| `getTask`      | `taskId: string`                           | 获取任务详情     |
| `getUserTasks` | `userId, page?, pageSize?`                 | 获取用户任务列表 |
| `cancelTask`   | `taskId: string`                           | 取消任务         |
| `retryTask`    | `taskId: string`                           | 重试任务         |
| `deleteTask`   | `taskId: string`                           | 删除任务         |

---

## 8.工具模块

### 8.1 platform（平台检测）

**文件路径**: `src/utils/platform.ts`

| 函数              | 返回值    | 说明               |
|-------------------|-----------|--------------------|
| `getPlatform()`   | `Platform`| 获取当前平台标识   |
| `isWeixin()`      | `boolean` | 是否微信小程序     |
| `isAlipay()`      | `boolean` | 是否支付宝小程序   |
| `isH5()`          | `boolean` | 是否 H5            |
| `isApp()`         | `boolean` | 是否 App           |
| `getPlatformName()`| `string` | 获取平台中文名称   |

```typescript
type Platform = 'h5' | 'mp-weixin' | 'mp-alipay' | 'app';
```

### 8.2 storage（本地存储）

**文件路径**: `src/utils/storage.ts`

基于 `uni.setStorageSync` / `uni.getStorageSync` 的封装，所有键名自动添加 `video_remover_` 前缀，值自动 JSON 序列化。

| 函数           | 参数                    | 说明           |
|----------------|------------------------|----------------|
| `getItem<T>`   | `key: string`          | 获取存储项     |
| `setItem<T>`   | `key: string, value: T`| 设置存储项     |
| `removeItem`   | `key: string`          | 删除存储项     |
| `clear`        | 无                     | 清除所有存储   |

---

## 9.类型定义

### 9.1 任务类型

**文件路径**: `src/types/task.d.ts`

```typescript
type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
type TaskType = 'subtitle' | 'icon';

interface Task {
  id: string;
  userId: string;
  videoUrl: string;
  resultUrl: string | null;
  status: TaskStatus;
  taskType: TaskType;
  params: Record<string, any>;
  createdAt: string;
  completedAt: string | null;
}
```

### 9.2 用户类型

**文件路径**: `src/types/user.d.ts`

```typescript
interface UserInfo {
  id: string;
  openid: string;
  nickname: string;
  avatarUrl: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface LoginParams {
  code?: string;      // 微信登录 code
  authCode?: string;  // 支付宝登录 authCode
}

interface LoginResponse {
  token: string;
  user: UserInfo;
}
```

### 9.3 API 通用类型

**文件路径**: `src/types/api.d.ts`

```typescript
interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
```
