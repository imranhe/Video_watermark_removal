<template>
  <view class="container">
    <view class="header">
      <view class="title">处理中</view>
      <view class="subtitle">请耐心等待，正在处理您的视频</view>
    </view>

    <view class="content">
      <!-- 进度展示 -->
      <view class="progress-section">
        <view class="progress-ring">
          <view class="progress-text">{{ progress }}%</view>
        </view>
        <view class="status-label">{{ statusLabel }}</view>
      </view>

      <!-- 进度条 -->
      <view class="progress-bar-wrapper">
        <view class="progress-bar" :style="{ width: progress + '%' }"></view>
      </view>

      <!-- 任务信息 -->
      <view class="task-info" v-if="currentTask">
        <view class="info-row">
          <text class="info-label">任务ID</text>
          <text class="info-value">{{ currentTask.id }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">任务类型</text>
          <text class="info-value">{{ currentTask.taskType === 'subtitle' ? '去除字幕' : '去除图标' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatTime(currentTask.createdAt) }}</text>
        </view>
      </view>

      <!-- 错误信息 -->
      <view class="error-section" v-if="currentTask?.status === 'failed'">
        <view class="error-text">{{ currentTask.errorMessage || '处理失败，请重试' }}</view>
        <button class="btn-retry" @tap="retryTask">重新处理</button>
      </view>

      <!-- 取消按钮 -->
      <button class="btn-cancel" @tap="cancelTask" v-if="currentTask?.status === 'processing' || currentTask?.status === 'pending'">
        取消任务
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTaskStore } from '@/store/task';

const taskStore = useTaskStore();
const taskId = ref('');

const currentTask = computed(() => taskStore.currentTask);
const progress = computed(() => currentTask.value?.progress || 0);

const statusLabel = computed(() => {
  const status = currentTask.value?.status;
  const labels: Record<string, string> = {
    pending: '排队中...',
    processing: '处理中...',
    completed: '处理完成',
    failed: '处理失败',
  };
  return labels[status || ''] || '处理中...';
});

onLoad((options) => {
  if (options?.taskId) {
    taskId.value = options.taskId;
    taskStore.fetchTask(options.taskId).then(() => {
      const task = taskStore.currentTask;
      if (task && (task.status === 'pending' || task.status === 'processing')) {
        taskStore.startPollingTask(options.taskId);
      }
      if (task?.status === 'completed') {
        goToResult();
      }
    });
  }
});

// 监听任务完成
const stopWatch = watch(
  () => taskStore.currentTask?.status,
  (status) => {
    if (status === 'completed') {
      goToResult();
    }
  }
);

function goToResult() {
  uni.redirectTo({
    url: `/pages-sub/video/result?taskId=${taskId.value}`,
  });
}

async function retryTask() {
  if (!taskId.value) return;
  try {
    const task = await taskStore.fetchTask(taskId.value);
    if (task) {
      taskStore.startPollingTask(taskId.value);
    }
  } catch {
    uni.showToast({ title: '重试失败', icon: 'none' });
  }
}

function cancelTask() {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消当前任务吗？',
    success: (res) => {
      if (res.confirm) {
        taskStore.stopPollingTask();
        uni.navigateBack();
      }
    },
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

onUnmounted(() => {
  stopWatch();
  taskStore.stopPollingTask();
});
</script>

<style scoped>
.container {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  text-align: center;
  margin-bottom: 30px;
}
.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.subtitle {
  font-size: 14px;
  color: #666;
}
.content {
  background: #fff;
  border-radius: 12px;
  padding: 30px 20px;
}
.progress-section {
  text-align: center;
  margin-bottom: 30px;
}
.progress-ring {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 6px solid #e6f2ff;
  border-top-color: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  animation: spin 1.5s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.progress-text {
  font-size: 28px;
  font-weight: bold;
  color: #007AFF;
}
.status-label {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}
.progress-bar-wrapper {
  height: 8px;
  background: #e6f2ff;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 30px;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #007AFF, #667eea);
  border-radius: 4px;
  transition: width 0.3s ease;
}
.task-info {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}
.info-label {
  font-size: 14px;
  color: #666;
}
.info-value {
  font-size: 14px;
  color: #333;
}
.error-section {
  text-align: center;
  margin-bottom: 20px;
}
.error-text {
  font-size: 14px;
  color: #ff3b30;
  margin-bottom: 15px;
}
.btn-retry {
  width: 100%;
  height: 50px;
  background: #007AFF;
  color: #fff;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
}
.btn-cancel {
  width: 100%;
  height: 44px;
  background: #f5f5f5;
  color: #666;
  border-radius: 22px;
  font-size: 14px;
}
</style>
