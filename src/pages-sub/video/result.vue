<template>
  <view class="container">
    <view class="header">
      <view class="success-icon">✓</view>
      <view class="title">处理完成</view>
    </view>

    <view class="content">
      <!-- 结果视频 -->
      <view class="video-section" v-if="resultUrl">
        <video :src="resultUrl" class="video-player" controls></video>
      </view>

      <!-- 任务信息 -->
      <view class="info-card" v-if="currentTask">
        <view class="info-row">
          <text class="info-label">任务类型</text>
          <text class="info-value">{{ currentTask.taskType === 'subtitle' ? '去除字幕' : '去除图标' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">处理状态</text>
          <text class="info-value success">已完成</text>
        </view>
        <view class="info-row">
          <text class="info-label">完成时间</text>
          <text class="info-value">{{ formatTime(currentTask.completedAt || currentTask.createdAt) }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <button class="btn-primary" @tap="downloadResult">保存到相册</button>
        <button class="btn-secondary" @tap="shareResult">分享结果</button>
        <button class="btn-outline" @tap="goHome">返回首页</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTaskStore } from '@/store/task';

const taskStore = useTaskStore();
const currentTask = computed(() => taskStore.currentTask);
const resultUrl = computed(() => currentTask.value?.resultUrl || '');

onLoad((options) => {
  if (options?.taskId) {
    taskStore.fetchTask(options.taskId);
  }
});

function downloadResult() {
  if (!resultUrl.value) return;
  uni.showLoading({ title: '保存中...' });
  uni.saveVideoToPhotosAlbum({
    filePath: resultUrl.value,
    success: () => {
      uni.hideLoading();
      uni.showToast({ title: '已保存到相册', icon: 'success' });
    },
    fail: () => {
      uni.hideLoading();
      uni.showToast({ title: '保存失败', icon: 'none' });
    },
  });
}

function shareResult() {
  uni.showToast({ title: '分享功能开发中', icon: 'none' });
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' });
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
  text-align: center;
  margin-bottom: 20px;
}
.success-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #34c759;
  color: #fff;
  font-size: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
}
.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.content {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.video-section {
  margin-bottom: 20px;
}
.video-player {
  width: 100%;
  height: 220px;
  border-radius: 8px;
}
.info-card {
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
  font-weight: 500;
}
.info-value.success {
  color: #34c759;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.btn-primary {
  width: 100%;
  height: 50px;
  background: #007AFF;
  color: #fff;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
}
.btn-secondary {
  width: 100%;
  height: 50px;
  background: #34c759;
  color: #fff;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
}
.btn-outline {
  width: 100%;
  height: 44px;
  background: transparent;
  color: #007AFF;
  border: 2px solid #007AFF;
  border-radius: 22px;
  font-size: 14px;
}
</style>
