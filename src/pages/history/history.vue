<template>
  <view class="container">
    <view class="header">
      <view class="title">处理历史</view>
    </view>

    <!-- 任务列表 -->
    <view class="task-list" v-if="tasks.length > 0">
      <view
        class="task-card"
        v-for="task in tasks"
        :key="task.id"
        @tap="viewTask(task)"
      >
        <view class="task-header">
          <text class="task-type">{{ task.taskType === 'subtitle' ? '去除字幕' : '去除图标' }}</text>
          <text class="task-status" :class="task.status">{{ statusLabel(task.status) }}</text>
        </view>
        <view class="task-info">
          <text class="task-id">ID: {{ task.id }}</text>
          <text class="task-time">{{ formatTime(task.createdAt) }}</text>
        </view>
        <view class="task-progress" v-if="task.status === 'processing'">
          <view class="progress-bar-wrapper">
            <view class="progress-bar" :style="{ width: task.progress + '%' }"></view>
          </view>
          <text class="progress-text">{{ task.progress }}%</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <view class="empty-icon">📋</view>
      <view class="empty-text">暂无处理记录</view>
      <button class="btn-primary" @tap="goHome">去处理视频</button>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="tasks.length > 0 && hasMore" @tap="loadMore">
      <text>{{ isLoading ? '加载中...' : '加载更多' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useTaskStore } from '@/store/task';
import { useUserStore } from '@/store/user';

const taskStore = useTaskStore();
const userStore = useUserStore();

const tasks = computed(() => taskStore.tasks);
const isLoading = computed(() => taskStore.isLoading);
const page = ref(1);
const hasMore = ref(true);

onShow(() => {
  loadTasks();
});

async function loadTasks() {
  if (!userStore.userInfo?.id) return;
  page.value = 1;
  try {
    const result = await taskStore.fetchUserTasks(userStore.userInfo.id);
    hasMore.value = result.length >= 20;
  } catch {
    // ignore
  }
}

async function loadMore() {
  if (isLoading.value || !hasMore.value) return;
  page.value++;
  // TODO: implement pagination with getUserTasks API
  hasMore.value = false;
}

function viewTask(task: any) {
  if (task.status === 'completed' && task.resultUrl) {
    uni.navigateTo({ url: `/pages-sub/video/result?taskId=${task.id}` });
  } else if (task.status === 'processing' || task.status === 'pending') {
    uni.navigateTo({ url: `/pages-sub/video/processing?taskId=${task.id}` });
  }
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' });
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '排队中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  };
  return labels[status] || status;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
</script>

<style scoped>
.container {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  margin-bottom: 20px;
}
.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.task-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.task-type {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}
.task-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
  font-weight: 500;
}
.task-status.pending {
  background: #fff3e0;
  color: #ff9800;
}
.task-status.processing {
  background: #e3f2fd;
  color: #2196f3;
}
.task-status.completed {
  background: #e8f5e9;
  color: #4caf50;
}
.task-status.failed {
  background: #ffebee;
  color: #f44336;
}
.task-info {
  display: flex;
  justify-content: space-between;
}
.task-id {
  font-size: 12px;
  color: #999;
}
.task-time {
  font-size: 12px;
  color: #999;
}
.task-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.progress-bar-wrapper {
  flex: 1;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: #2196f3;
  border-radius: 3px;
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 12px;
  color: #2196f3;
  font-weight: 500;
  min-width: 35px;
  text-align: right;
}
.empty-state {
  text-align: center;
  padding: 80px 20px;
}
.empty-icon {
  font-size: 60px;
  margin-bottom: 15px;
}
.empty-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 25px;
}
.btn-primary {
  width: 200px;
  height: 44px;
  background: #007AFF;
  color: #fff;
  border-radius: 22px;
  font-size: 15px;
}
.load-more {
  text-align: center;
  padding: 15px;
  color: #007AFF;
  font-size: 14px;
}
</style>
