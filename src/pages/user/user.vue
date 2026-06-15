<template>
  <view class="container">
    <view class="user-header">
      <view class="avatar-section" @tap="handleAvatarTap">
        <image
          v-if="userInfo?.avatarUrl"
          :src="userInfo.avatarUrl"
          class="avatar"
          mode="aspectFill"
        />
        <view v-else class="avatar-placeholder">
          <text class="avatar-text">{{ isLoggedIn ? (userInfo?.nickname || '用') : '?' }}</text>
        </view>
        <view class="user-name">{{ isLoggedIn ? (userInfo?.nickname || '用户') : '点击登录' }}</view>
      </view>
    </view>

    <!-- 账户信息 -->
    <view class="info-card" v-if="isLoggedIn">
      <view class="info-row">
        <text class="info-label">积分余额</text>
        <text class="info-value highlight">{{ balance }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">已处理任务</text>
        <text class="info-value">{{ taskCount }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">注册时间</text>
        <text class="info-value">{{ formatTime(userInfo?.createdAt || '') }}</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <view class="menu-item" @tap="goToRecharge" v-if="isLoggedIn">
        <text class="menu-icon">💰</text>
        <text class="menu-text">充值中心</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="goToHistory">
        <text class="menu-icon">📋</text>
        <text class="menu-text">处理历史</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="showAbout">
        <text class="menu-icon">ℹ️</text>
        <text class="menu-text">关于我们</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="showFeedback">
        <text class="menu-icon">💬</text>
        <text class="menu-text">意见反馈</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section" v-if="isLoggedIn">
      <button class="btn-logout" @tap="handleLogout">退出登录</button>
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
const userInfo = computed(() => userStore.userInfo);
const balance = computed(() => userStore.balance);
const taskCount = computed(() => taskStore.taskCount);

function handleAvatarTap() {
  if (!isLoggedIn.value) {
    uni.navigateTo({ url: '/pages/login/login' });
  }
}

function goToRecharge() {
  uni.navigateTo({ url: '/pages-sub/service/recharge' });
}

function goToHistory() {
  uni.navigateTo({ url: '/pages/history/history' });
}

function showAbout() {
  uni.showToast({ title: '关于页面开发中', icon: 'none' });
}

function showFeedback() {
  uni.showToast({ title: '反馈功能开发中', icon: 'none' });
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.clearUser();
        taskStore.clearTasks();
        uni.showToast({ title: '已退出登录', icon: 'success' });
      }
    },
  });
}

function formatTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
}
.user-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 30px;
}
.avatar-section {
  display: flex;
  align-items: center;
  gap: 15px;
}
.avatar {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.5);
}
.avatar-placeholder {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-text {
  font-size: 28px;
  color: #fff;
  font-weight: bold;
}
.user-name {
  font-size: 20px;
  color: #fff;
  font-weight: bold;
}
.info-card {
  margin: 15px;
  background: #fff;
  border-radius: 12px;
  padding: 15px 20px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.info-row:last-child {
  border-bottom: none;
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
.info-value.highlight {
  color: #ff9500;
  font-size: 18px;
  font-weight: bold;
}
.menu-list {
  margin: 15px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-icon {
  font-size: 20px;
  margin-right: 12px;
}
.menu-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}
.menu-arrow {
  font-size: 14px;
  color: #ccc;
}
.logout-section {
  margin: 30px 15px;
}
.btn-logout {
  width: 100%;
  height: 44px;
  background: #fff;
  color: #ff3b30;
  border-radius: 22px;
  font-size: 15px;
  border: 1px solid #ff3b30;
}
</style>
