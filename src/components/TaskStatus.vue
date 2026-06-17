<template>
  <view class="task-status">
    <view class="task-card" :class="`status-${status}`">
      <view class="status-icon-wrap" :class="status">
        <text class="status-icon-char">{{ iconChar }}</text>
      </view>

      <view class="task-info">
        <text class="task-type">{{ taskTypeLabel }}</text>
        <text class="task-status-text">{{ statusLabel }}</text>
      </view>

      <view v-if="status === 'processing'" class="progress-section">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: `${progress}%` }"></view>
        </view>
        <text class="progress-text">{{ progress }}%</text>
      </view>

      <view v-if="status === 'completed'" class="complete-info">
        <text class="complete-time">完成时间: {{ formatTime(completedAt) }}</text>
        <button class="btn-download" @tap="handleDownload">下载视频</button>
      </view>

      <view v-if="status === 'failed'" class="error-info">
        <text class="error-message">{{ errorMessage }}</text>
        <button class="btn-retry" @tap="handleRetry">重新处理</button>
      </view>
    </view>

    <view class="task-details" v-if="!compact">
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
import { computed } from 'vue';
import { formatTime, formatDuration } from '@/utils/format';
import type { TaskStatus as TaskStatusType } from '@/types';

interface Props {
  taskId: string;
  status: TaskStatusType;
  taskType: 'subtitle' | 'watermark' | 'logo' | 'icon';
  progress: number;
  createdAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
  videoDuration?: number;
  resultUrl?: string | null;
  /** Compact mode: hides task-details panel (useful when page already shows its own info) */
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  errorMessage: '处理失败',
  videoDuration: 0,
  resultUrl: '',
  compact: false,
});

const emit = defineEmits<{
  (e: 'download', url: string): void;
  (e: 'retry', taskId: string): void;
}>();

const taskTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    subtitle: '去除字幕',
    watermark: '去除水印',
    logo: '去除图标',
    icon: '去除图标',
  };
  return labels[props.taskType] || '视频处理';
});

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    pending: '等待处理中...',
    processing: '正在处理...',
    completed: '处理完成',
    failed: '处理失败',
    cancelled: '已取消',
  };
  return labels[props.status] || props.status;
});

const iconChar = computed(() => {
  const map: Record<string, string> = {
    pending: '...',
    processing: '↻',
    completed: '✓',
    failed: '!',
    cancelled: '✕',
  };
  return map[props.status] || '?';
});

function handleDownload() {
  if (props.resultUrl) {
    emit('download', props.resultUrl);
    // #ifdef H5
    const link = document.createElement('a');
    link.href = props.resultUrl;
    link.download = `video_${props.taskId}.mp4`;
    link.click();
    // #endif
    // #ifdef MP-WEIXIN,MP-ALIPAY
    uni.previewMedia({ sources: [{ url: props.resultUrl, type: 'video' }] });
    // #endif
  }
}

function handleRetry() {
  emit('retry', props.taskId);
}
</script>

<style scoped>
.task-status { width: 100%; }
.task-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-xs);
}
.task-card.status-pending { border-left: 4px solid var(--color-warning); }
.task-card.status-processing { border-left: 4px solid var(--color-primary); }
.task-card.status-completed { border-left: 4px solid var(--color-success); }
.task-card.status-failed { border-left: 4px solid var(--color-error); }
.task-card.status-cancelled { border-left: 4px solid var(--color-text-tertiary); }

.status-icon-wrap {
  width: 40px; height: 40px;
  border-radius: var(--radius-full);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: var(--space-3);
}
.status-icon-wrap.pending { background: var(--color-warning-light); }
.status-icon-wrap.processing { background: var(--color-primary-light); }
.status-icon-wrap.completed { background: var(--color-success-light); }
.status-icon-wrap.failed { background: var(--color-error-light); }
.status-icon-wrap.cancelled { background: var(--color-bg-tertiary); }
.status-icon-char { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); }
.status-icon-wrap.pending .status-icon-char { color: var(--color-warning); }
.status-icon-wrap.processing .status-icon-char { color: var(--color-primary); }
.status-icon-wrap.completed .status-icon-char { color: var(--color-success); }
.status-icon-wrap.failed .status-icon-char { color: var(--color-error); }
.status-icon-wrap.cancelled .status-icon-char { color: var(--color-text-tertiary); }

.task-info { margin-bottom: var(--space-3); }
.task-type { display: block; font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin-bottom: 2px; }
.task-status-text { font-size: var(--font-size-sm); color: var(--color-text-secondary); }

.progress-section { margin-bottom: var(--space-3); display: flex; align-items: center; gap: var(--space-3); }
.progress-bar { flex: 1; height: 4px; background: var(--color-separator); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width var(--transition-normal); }
.progress-text { font-size: var(--font-size-xs); color: var(--color-primary); font-weight: var(--font-weight-medium); }

.complete-time { display: block; font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--space-3); }
.btn-download {
  width: 140px; height: var(--btn-height-sm);
  background: var(--color-success); color: #fff;
  font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm); border: none;
  display: inline-flex; align-items: center; justify-content: center;
}

.error-message { display: block; font-size: var(--font-size-sm); color: var(--color-error); margin-bottom: var(--space-3); }
.btn-retry {
  width: 140px; height: var(--btn-height-sm);
  background: var(--color-error); color: #fff;
  font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm); border: none;
  display: inline-flex; align-items: center; justify-content: center;
}

.task-details {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}
.detail-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 0.5px solid var(--color-separator);
}
.detail-item:last-child { border-bottom: none; }
.detail-label { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.detail-value { font-size: var(--font-size-sm); color: var(--color-text-primary); font-weight: var(--font-weight-medium); }
</style>
