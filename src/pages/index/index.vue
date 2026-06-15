<template>
  <view class="container">
    <!-- 头部 -->
    <view class="header">
      <view class="logo">🎬</view>
      <view class="title">视频去字幕</view>
      <view class="subtitle">一键去除视频中的字幕和图标</view>
    </view>

    <!-- 功能卡片 -->
    <view class="features">
      <view class="feature-card" @tap="goToUpload('subtitle')">
        <view class="feature-icon">📝</view>
        <view class="feature-title">去除字幕</view>
        <view class="feature-desc">智能识别并去除视频字幕</view>
      </view>

      <view class="feature-card" @tap="goToUpload('icon')">
        <view class="feature-icon">🚫</view>
        <view class="feature-title">去除图标</view>
        <view class="feature-desc">去除视频中的水印图标</view>
      </view>
    </view>

    <!-- 快速上传 -->
    <view class="upload-section">
      <button class="upload-btn" @tap="goToUpload('subtitle')">
        选择视频开始处理
      </button>
    </view>

    <!-- 使用统计 -->
    <view class="stats" v-if="isLoggedIn">
      <view class="stat-item">
        <view class="stat-number">{{ taskCount }}</view>
        <view class="stat-label">已处理</view>
      </view>
      <view class="stat-item">
        <view class="stat-number">{{ balance }}</view>
        <view class="stat-label">积分余额</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/store/user';
import { useTaskStore } from '@/store/task';

const userStore = useUserStore();
const taskStore = useTaskStore();

const isLoggedIn = computed(() => userStore.isLoggedIn);
const taskCount = computed(() => taskStore.taskCount);
const balance = computed(() => userStore.balance);

function goToUpload(type: 'subtitle' | 'icon') {
  uni.navigateTo({
    url: `/pages-sub/video/upload?type=${type}`,
  });
}
</script>

<style scoped>
.container {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.header {
  text-align: center;
  padding: 40px 0;
  color: #fff;
}

.logo {
  font-size: 60px;
  margin-bottom: 10px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.8;
}

.features {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.feature-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.feature-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.feature-desc {
  font-size: 12px;
  color: #666;
}

.upload-section {
  margin-bottom: 30px;
}

.upload-btn {
  width: 100%;
  height: 50px;
  background: #fff;
  color: #667eea;
  font-size: 16px;
  font-weight: bold;
  border-radius: 25px;
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.stats {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}
</style>
