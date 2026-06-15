<template>
  <view class="task-status">
    <!-- 任务卡片 -->
    <view class="task-card" :class="statusClass">
      <!-- 状态图标 -->
      <view class="status-icon">
        <text v-if="status === 'pending'">⏳</text>
        <text v-else-if="status === 'processing'">⚙️</text>
        <text v-else-if="status === 'completed'">✅</text>
        <text v-else-if="status === 'failed'">❌</text>
      </view>

      <!-- 任务信息 -->
      <view class="task-info">
        <view class="task-type">{{ taskTypeLabel }}</view>
        <view class="task-status-text">{{ statusLabel }}</view>
      </view>

      <!-- 进度条（仅处理中显示） -->
      <view v-if="status === 'processing'" class="progress-section">
        <view class="progress-bar">
          <view
            class="progress-fill"
            :style="{ width: `${progress}%` }"
          ></view>
        </view>
        <view class="progress-text">{{ progress }}%</view>
      </view>

      <!-- 完成信息 -->
      <view v-if="status === 'completed'" class="complete-info">
        <view class="complete-time">完成时间: {{ formatTime(completedAt) }}</view>
        <button class="btn-download" @tap="handleDownload">
          下载视频
        </button>
      </view>

      <!-- 错误信息 -->
      <view v-if="status === 'failed'" class="error-info">
        <view class="error-message">{{ errorMessage }}</view>
        <button class="btn-retry" @tap="handleRetry">
          重新处理
        </button>
      </view>
    </view>

    <!-- 任务详情 -->
    <view class="task-details">
      <view class="detail-item">
        <text class="detail-label">任务ID</text>
        <text class="detail-value">{{ taskId }}</text>
      </view>
      <view class="detail-item">
        <text class="detail-label">创建时间</text>
        <text class="detail-value">{{ formatTime(createdAt) }}</text>
      </view>
      <view class="detail-item" v-if="videoDuration">
        <text class="detail-label">视频时长</text>
        <text class="detail-value">{{ formatDuration(videoDuration) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue';

type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface Props {
  taskId: string;
  status: TaskStatus;
  taskType: 'subtitle' | 'icon';
  progress: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  videoDuration?: number;
  resultUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  errorMessage: '处理失败',
  videoDuration: 0,
  resultUrl: '',
});

const emit = defineEmits<{
  (e: 'download', url: string): void;
  (e: 'retry', taskId: string): void;
}>();

// 任务类型标签
const taskTypeLabel = computed(() => {
  return props.taskType === 'subtitle' ? '去除字幕' : '去除图标';
});

// 状态标签
const statusLabel = computed(() => {
  const labels: Record<TaskStatus, string> = {
    pending: '等待处理中...',
    processing: '正在处理...',
    completed: '处理完成',
    failed: '处理失败',
  };
  return labels[props.status];
});

// 状态样式类
const statusClass = computed(() => `status-${props.status}`);

// 格式化时间
function formatTime(timeStr?: string): string {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 格式化时长
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}分${remainingSeconds}秒`;
}

// 下载处理结果
function handleDownload() {
  if (props.resultUrl) {
    emit('download', props.resultUrl);

    // H5端直接下载
    // #ifdef H5
    const link = document.createElement('a');
    link.href = props.resultUrl;
    link.download = `video_${props.taskId}.mp4`;
    link.click();
    // #endif

    // 小程序端预览
    // #ifdef MP-WEIXIN,MP-ALIPAY
    uni.previewMedia({
      sources: [{
        url: props.resultUrl,
        type: 'video',
      }],
    });
    // #endif
  }
}

// 重试处理
function handleRetry() {
  emit('retry', props.taskId);
}
</script>

<style scoped>
.task-status {
  width: 100%;
}

.task-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.task-card.status-pending {
  border-left: 4px solid #faad14;
}

.task-card.status-processing {
  border-left: 4px solid #1890ff;
}

.task-card.status-completed {
  border-left: 4px solid #52c41a;
}

.task-card.status-failed {
  border-left: 4px solid #ff4d4f;
}

.status-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.task-info {
  margin-bottom: 15px;
}

.task-type {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.task-status-text {
  font-size: 14px;
  color: #666;
}

.progress-section {
  margin-bottom: 15px;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #00c6ff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #1890ff;
  font-weight: bold;
  text-align: right;
}

.complete-info,
.error-info {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.complete-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.btn-download {
  width: 100%;
  height: 40px;
  background: #52c41a;
  color: #fff;
  font-size: 14px;
  border-radius: 20px;
  border: none;
}

.error-message {
  font-size: 12px;
  color: #ff4d4f;
  margin-bottom: 10px;
}

.btn-retry {
  width: 100%;
  height: 40px;
  background: #fff;
  color: #ff4d4f;
  font-size: 14px;
  border-radius: 20px;
  border: 1px solid #ff4d4f;
}

.task-details {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #666;
}

.detail-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
</style>
