# Phase 2 开发任务清单

## ✅ Phase 1 已完成
- [x] 项目初始化
- [x] Pinia 状态管理
- [x] 网络请求工具
- [x] 路由配置
- [x] Docker 环境

## ⏳ Phase 2 核心功能（当前）

### 任务 1: 视频上传组件
**文件**: `src/components/video-uploader/video-uploader.vue`
**功能**:
- 从相册选择视频
- 视频预览
- 格式检测 (mp4/mov/avi)
- 大小限制 (max 100MB)
- 时长显示
- 上传进度

**API**:
```typescript
wx.chooseMedia({
  mediaType: ['video'],
  sourceType: ['album', 'camera'],
  maxCount: 1,
  success: (res) => {
    const tempFilePath = res.tempFiles[0].tempFilePath
    const size = res.tempFiles[0].size
    const duration = res.tempFiles[0].duration
  }
})
```

---

### 任务 2: 处理选项选择页
**文件**: `src/pages/upload/upload.vue` (更新)
**功能**:
- 视频信息展示
- 处理类型选择（去字幕/去水印/去图标）
- 积分消耗提示
- 开始处理按钮

**UI**:
```vue
<view class="process-type-selector">
  <radio-group>
    <radio value="subtitle">🎬 去字幕</radio>
    <radio value="watermark">💧 去水印</radio>
    <radio value="logo">🏷️ 去图标</radio>
  </radio-group>
</view>
<button type="primary" bind:tap="startProcessing">
  开始处理 (消耗{{points}}积分)
</button>
```

---

### 任务 3: 任务管理 Store
**文件**: `src/store/task.ts` (更新)
**功能**:
- 创建任务
- 任务列表
- 状态轮询
- 进度更新

**类型**:
```typescript
interface Task {
  id: string
  user_id: number
  original_video_url: string
  processed_video_url?: string
  task_type: 'subtitle' | 'watermark' | 'logo'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  points_cost: number
  created_at: string
  completed_at?: string
}
```

**API**:
```typescript
// 创建任务
POST /api/tasks
{
  original_video_url: string,
  task_type: string,
  points_cost: number
}

// 查询任务状态  
GET /api/tasks/:id

// 轮询进度
wx polling every 3s until status === 'completed'
```

---

### 任务 4: 处理进度页
**文件**: `src/pages/processing/processing.vue`
**功能**:
- 进度条动画
- 状态文字提示
- 预计剩余时间
- 后台处理提示

**状态文案**:
- "正在分析视频..." (0-20%)
- "正在识别字幕区域..." (20-40%)
- "正在去除字幕..." (40-80%)
- "正在生成视频..." (80-100%)
- "处理完成！" (100%)

---

### 任务 5: 结果展示页
**文件**: `src/pages/result/result.vue`
**功能**:
- 视频播放器
- 处理前后对比切换
- 下载按钮
- 保存相册
- 重新处理
- 分享

**API**:
```vue
<video 
  :src="videoUrl" 
  controls 
  show-play-btn
  show-fullscreen-btn
/>

<button bind:tap="downloadVideo">下载视频</button>
<button bind:tap="saveToAlbum">保存到相册</button>

wx.saveVideoToPhotosAlbum({
  filePath: tempFilePath,
  success: () => {}
})
```

---

### 任务 6: 历史记录页
**文件**: `src/pages/history/history.vue`
**功能**:
- 任务列表展示
- 按时间倒序
- 状态筛选（全部/已完成/处理中）
- 下拉刷新
- 上拉加载更多

---

### 任务 7: API 接口封装
**文件**: `src/api/task.ts` (新建)
**功能**:
```typescript
export interface TaskCreateParams {
  original_video_url: string
  task_type: 'subtitle' | 'watermark' | 'logo'
}

export interface TaskResponse {
  id: string
  status: string
  progress: number
  processed_video_url?: string
}

// 创建任务
export function createTask(params: TaskCreateParams): Promise<TaskResponse>

// 查询任务状态
export function getTaskStatus(taskId: string): Promise<TaskResponse>

// 轮询直到完成
export function pollTaskCompletion(taskId: string): Promise<TaskResponse>
```

---

### 任务 8: 视频处理服务
**文件**: `src/services/video-processor.ts` (新建)
**功能**:
```typescript
// 上传视频到 OSS
export async function uploadVideo(filePath: string): Promise<string>

// 调用 AI 处理 API
export async function processVideo(options: {
  videoUrl: string
  type: 'subtitle' | 'watermark' | 'logo'
  region?: {x: number, y: number, width: number, height: number}
}): Promise<{taskId: string}>

// 下载处理后的视频
export async function downloadProcessedVideo(videoUrl: string): Promise<string>
```

---

## 📋 开发顺序

1. **任务 8** - 视频处理服务基础框架
2. **任务 7** - API 接口封装
3. **任务 3** - Task Store 更新
4. **任务 1** - 视频上传组件
5. **任务 2** - 处理选项页面
6. **任务 4** - 处理进度页
7. **任务 5** - 结果展示页
8. **任务 6** - 历史记录页

---

## 🎯 下一步行动

从任务 1 开始：创建视频上传组件

```bash
# 创建组件目录
mkdir -p src/components/video-uploader

# 创建组件文件
touch src/components/video-uploader/video-uploader.vue
touch src/components/video-uploader/video-uploader.ts
touch src/components/video-uploader/video-uploader.css
```

然后逐步完成每个任务。