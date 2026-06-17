<template>
  <view class="page">
    <!-- Scroll View Wrapper -->
    <view class="profile-container">

      <!-- Top Header User Profile Card -->
      <view class="profile-identity-card">
        <!-- Avatar: inline SVG glasses-guy -->
        <view class="avatar-circle">
          <image
            v-if="isLoggedIn && userInfo?.avatarUrl"
            class="avatar-img"
            :src="userInfo.avatarUrl"
            mode="aspectFill"
          />
          <view v-else class="avatar-svg-wrap">
            <text class="avatar-char">人</text>
          </view>
        </view>
        <text class="user-id-text">ID: {{ displayUserId }}</text>
      </view>

      <!-- Quota Card -->
      <view class="quota-card" @tap="goTo('/pages-sub/service/vip')">
        <text class="quota-seconds">{{ balance }}s 剩余</text>
        <view class="quota-daily-wrap">
          <view class="quota-daily-badge">
            <text class="quota-daily-text">每日额度</text>
          </view>
        </view>
        <text class="quota-vip-label">{{ vipLabel }}</text>
      </view>

      <!-- Menu List -->
      <view class="menu-section">
        <view class="menu-card">
          <!-- 1: Top-up -->
          <view class="menu-item" @tap="goTo('/pages-sub/service/recharge')">
            <view class="menu-icon-wrap menu-icon-orange">
              <text class="menu-icon-char">$</text>
            </view>
            <text class="menu-label">充值中心</text>
            <text class="menu-arrow">&#x203A;</text>
          </view>
          <view class="menu-divider"></view>

          <!-- 2: History -->
          <view class="menu-item" @tap="goSwitchTab('/pages/history/history')">
            <view class="menu-icon-wrap menu-icon-blue">
              <text class="menu-icon-char">时</text>
            </view>
            <text class="menu-label">处理历史</text>
            <text class="menu-arrow">&#x203A;</text>
          </view>
          <view class="menu-divider"></view>

          <!-- 3: Share -->
          <view class="menu-item" @tap="openShareModal">
            <view class="menu-icon-wrap menu-icon-green">
              <text class="menu-icon-char">享</text>
            </view>
            <text class="menu-label">分享给好友</text>
            <text class="menu-arrow">&#x203A;</text>
          </view>
          <view class="menu-divider"></view>

          <!-- 4: Contact Support -->
          <view class="menu-item" @tap="openSupportModal">
            <view class="menu-icon-wrap menu-icon-purple">
              <text class="menu-icon-char">服</text>
            </view>
            <text class="menu-label">联系客服</text>
            <text class="menu-arrow">&#x203A;</text>
          </view>
        </view>
      </view>

    </view>

    <!-- Share Modal -->
    <view v-if="showShareModal" class="modal-overlay" @tap="showShareModal = false">
      <view class="modal-center" @tap.stop>
        <view class="share-modal-card">
          <!-- Close button -->
          <view class="modal-close-btn" @tap="showShareModal = false">
            <text class="modal-close-char">×</text>
          </view>

          <view class="share-content">
            <!-- Share icon -->
            <view class="share-icon-wrap">
              <text class="share-icon-char">享</text>
            </view>
            <text class="share-title">邀请好友 共享时长</text>
            <text class="share-desc">分享给好友，只要好友通过您的专属链接访问注册，双方均可立即额外解锁 <text class="share-highlight">100秒</text> 永久使用时长！</text>

            <!-- Share link block -->
            <view class="share-link-block">
              <text class="share-link-label">专属推广链接</text>
              <text class="share-link-url" user-select>{{ shareUrl }}</text>
            </view>

            <!-- Copy button -->
            <view class="share-copy-btn" @tap="handleCopyShareLink">
              <text class="share-copy-char">复</text>
              <text class="share-copy-text">{{ copiedLink ? '链接复制成功！' : '一键复制分享链接' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Support Chat Modal -->
    <view v-if="showSupportModal" class="modal-overlay" @tap="showSupportModal = false">
      <view class="modal-center" @tap.stop>
        <view class="support-modal-card">
          <!-- Header -->
          <view class="support-header">
            <view class="support-header-left">
              <view class="support-online-dot"></view>
              <text class="support-header-title">在线客服</text>
            </view>
            <view class="support-header-close" @tap="showSupportModal = false">
              <text class="modal-close-char">×</text>
            </view>
          </view>

          <!-- Chat messages -->
          <scroll-view class="chat-messages" scroll-y :scroll-into-view="scrollTarget">
            <view
              v-for="msg in chatMessages"
              :key="msg.id"
              :id="'msg-' + msg.id"
              class="chat-msg-wrap"
              :class="msg.sender === 'bot' ? 'chat-msg-left' : 'chat-msg-right'"
            >
              <view
                class="chat-bubble"
                :class="msg.sender === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user'"
              >
                <text class="chat-bubble-text">{{ msg.text }}</text>
              </view>
              <text class="chat-timestamp">{{ msg.timestamp }}</text>
            </view>
            <view :id="scrollTarget" style="height: 1px;"></view>
          </scroll-view>

          <!-- Input bar -->
          <view class="chat-input-bar">
            <input
              class="chat-input"
              v-model="inputMessage"
              placeholder="在此输入您的问题描述..."
              placeholder-class="chat-input-placeholder"
              @confirm="handleSendMessage"
              confirm-type="send"
            />
            <view class="chat-send-btn" @tap="handleSendMessage">
              <text class="chat-send-char">发</text>
            </view>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useUserStore } from '@/store/user';
import { useTaskStore } from '@/store/task';

const userStore = useUserStore();
const taskStore = useTaskStore();

// --- Modal states ---
const showShareModal = ref(false);
const showSupportModal = ref(false);
const copiedLink = ref(false);

// --- Chat state ---
interface ChatMsg {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

function nowTime(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const chatMessages = ref<ChatMsg[]>([
  {
    id: 'init_1',
    sender: 'bot',
    text: '您好！我是极简去水印智能客服助理。请问您在使用过程中遇到了什么问题？',
    timestamp: nowTime(),
  },
  {
    id: 'init_2',
    sender: 'bot',
    text: '推荐热点问题回复：\n1. 如何消除短视频水印？\n2. 每日免费时长是多少，怎么充值增加？\n3. 画笔涂抹不均匀如何精细化去除？',
    timestamp: nowTime(),
  },
]);
const inputMessage = ref('');
const scrollTarget = ref('scroll-anchor');

// --- Computed ---
const isLoggedIn = computed(() => userStore.isLoggedIn);
const userInfo = computed(() => userStore.userInfo);
const balance = computed(() => userStore.balance);

const displayUserId = computed(() => {
  if (userInfo.value?.id) return userInfo.value.id;
  return '------';
});

const vipLabel = computed(() => {
  const vipType = userStore.userInfo?.vipType;
  if (!vipType || vipType === 'none') return '未开通会员';
  const map: Record<string, string> = {
    monthly: '月卡会员',
    quarterly: '季卡会员',
    yearly: '年卡会员',
  };
  return map[vipType] || '会员';
});

const shareUrl = computed(() => {
  return `https://app.example.com/?ref=${displayUserId.value}`;
});

// --- Actions ---
function goTo(url: string) {
  uni.navigateTo({ url });
}

function goSwitchTab(url: string) {
  uni.switchTab({ url });
}

function openShareModal() {
  showShareModal.value = true;
}

function openSupportModal() {
  showSupportModal.value = true;
}

function handleCopyShareLink() {
  uni.setClipboardData({
    data: shareUrl.value,
    success: () => {
      copiedLink.value = true;
      setTimeout(() => {
        copiedLink.value = false;
      }, 2000);
    },
  });
}

function handleSendMessage() {
  const text = inputMessage.value.trim();
  if (!text) return;

  const userMsg: ChatMsg = {
    id: 'u_' + Date.now(),
    sender: 'user',
    text,
    timestamp: nowTime(),
  };
  chatMessages.value.push(userMsg);
  inputMessage.value = '';

  scrollToBottom();

  const lowerTxt = text.toLowerCase();

  setTimeout(() => {
    let reply = '抱歉，我未能完全理解您的问题。您可以尝试输入："充值"、"视频"、"图片"或联系人工客服邮箱 gimlanhe@gmail.com 获得深度支持。';

    if (lowerTxt.includes('充值') || lowerTxt.includes('会员') || lowerTxt.includes('价格') || lowerTxt.includes('包月') || lowerTxt.includes('时长')) {
      reply = '充值与会员说明：您可以点击菜单中的【充值中心】前往"会员中心"选择体验套餐、基础版或高级版。体验版一年仅需99元（每天赠送300秒时长），购买成功后系统会即时为您增加时长和包月剩余天数！';
    } else if (lowerTxt.includes('视频') || lowerTxt.includes('链接') || lowerTxt.includes('抖音') || lowerTxt.includes('小红书') || lowerTxt.includes('tiktok')) {
      reply = '短视频平台提取教程：\n1. 在视频平台复制分享链接（如抖音中的"分享-复制链接"）。\n2. 打开首页，点击"链接提取"。\n3. 粘贴链接并点击解析。一键分析成功后即可直接把去水印原片保存到手机！';
    } else if (lowerTxt.includes('图片') || lowerTxt.includes('水印') || lowerTxt.includes('画笔') || lowerTxt.includes('涂抹') || lowerTxt.includes('擦除')) {
      reply = '图片修补精细化说明：点击首页的"图片去水印"进入编辑器。使用画笔涂红色轨迹完全捂盖住文字/Logo水印，接着点击"智能一键消除去水印"。AI 会结合周围画布进行自动中和，如果擦除不够完美，您可以选择重绘再次操作。';
    } else if (lowerTxt.includes('字幕') || lowerTxt.includes('音轨') || lowerTxt.includes('提取字幕')) {
      reply = '智能语音提取字幕介绍：您可以上传人声视频，点击"AI字幕"按钮。云引擎会快速分离人声音频并识别出普通话或英文，生成可自定义编辑的时间线输入卡片，最后支持导出标准 SRT 格式字幕供剪辑使用！';
    }

    const botMsg: ChatMsg = {
      id: 'b_' + Date.now(),
      sender: 'bot',
      text: reply,
      timestamp: nowTime(),
    };
    chatMessages.value.push(botMsg);
    scrollToBottom();
  }, 800);
}

function scrollToBottom() {
  scrollTarget.value = '';
  nextTick(() => {
    scrollTarget.value = 'scroll-anchor';
  });
}
</script>

<style scoped>
/* ===========================================
 * Page
 * =========================================== */
.page {
  min-height: 100vh;
  background-color: #FBFBFC;
}

.profile-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx 160rpx;
  gap: 48rpx;
}

/* ===========================================
 * Avatar / Identity Card
 * =========================================== */
.profile-identity-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  margin-top: 32rpx;
  flex-shrink: 0;
}

.avatar-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background-color: #f5f5f5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border: 4px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-svg-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-char {
  font-size: 40px;
  color: #a1a1aa;
  font-weight: 600;
}

.user-id-text {
  font-size: 28rpx;
  font-family: monospace;
  color: #52525b;
  letter-spacing: 2rpx;
  font-weight: 600;
}

/* ===========================================
 * Quota Card
 * =========================================== */
.quota-card {
  width: 100%;
  background-color: #905DFA;
  border-radius: 48rpx;
  padding: 48rpx;
  box-shadow: 0 8px 24px rgba(144, 93, 250, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.quota-seconds {
  font-size: 64rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
  letter-spacing: 2rpx;
}

.quota-daily-wrap {
  margin-top: 16rpx;
}

.quota-daily-badge {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 100rpx;
  padding: 8rpx 32rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.quota-daily-text {
  font-size: 22rpx;
  color: #E9F0FD;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  font-weight: 500;
}

.quota-vip-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 12rpx;
}

/* ===========================================
 * Menu List
 * =========================================== */
.menu-section {
  width: 100%;
  flex-shrink: 0;
}

.menu-card {
  background-color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  border-radius: 36rpx;
  overflow: hidden;
  border: 1rpx solid rgba(0, 0, 0, 0.04);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 36rpx 32rpx;
}

.menu-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1rpx solid transparent;
}

.menu-icon-char {
  font-size: 16px;
  font-weight: 700;
}

/* Icon color variants */
.menu-icon-orange {
  background-color: #FFF7ED;
  color: #F97316;
  border-color: #FFEDD5;
}

.menu-icon-blue {
  background-color: #EFF6FF;
  color: #3B82F6;
  border-color: #DBEAFE;
}

.menu-icon-green {
  background-color: #F0FDF4;
  color: #22C55E;
  border-color: #DCFCE7;
}

.menu-icon-purple {
  background-color: #F5F3FF;
  color: #22C55E;
  border-color: #EDE9FE;
}

.menu-label {
  flex: 1;
  font-size: 30rpx;
  color: #27272a;
  margin-left: 24rpx;
  font-weight: 600;
}

.menu-arrow {
  font-size: 36rpx;
  color: #d4d4d8;
  line-height: 1;
}

.menu-divider {
  height: 1rpx;
  background-color: #f4f4f5;
  margin-left: calc(72rpx + 32rpx + 24rpx);
}

/* ===========================================
 * Modal Overlay (shared)
 * =========================================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.modal-center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.modal-close-btn {
  position: absolute;
  top: 32rpx;
  right: 32rpx;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-close-svg {
  width: 40rpx;
  height: 40rpx;
  color: #9ca3af;
}

/* ===========================================
 * Share Modal
 * =========================================== */
.share-modal-card {
  background-color: #ffffff;
  border-radius: 48rpx;
  padding: 48rpx;
  width: 100%;
  max-width: 640rpx;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  position: relative;
  border: 1rpx solid #f3f4f6;
}

.share-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-top: 16rpx;
}

.share-icon-wrap {
  width: 96rpx;
  height: 96rpx;
  background-color: #EFF6FF;
  color: #3B82F6;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  border: 1rpx solid #DBEAFE;
}

.share-icon-svg {
  width: 48rpx;
  height: 48rpx;
}

.share-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2937;
}

.share-desc {
  font-size: 24rpx;
  color: #9ca3af;
  padding: 0 24rpx;
  margin-top: 12rpx;
  line-height: 1.6;
}

.share-highlight {
  color: #3B82F6;
  font-weight: 700;
}

.share-link-block {
  width: 100%;
  margin-top: 40rpx;
  background-color: #f9fafb;
  border: 1rpx solid #e5e7eb;
  border-radius: 24rpx;
  padding: 24rpx;
  text-align: left;
}

.share-link-label {
  font-size: 20rpx;
  color: #a1a1aa;
  font-weight: 500;
}

.share-link-url {
  font-size: 24rpx;
  color: #374151;
  font-family: monospace;
  margin-top: 8rpx;
  word-break: break-all;
}

.share-copy-btn {
  width: 100%;
  margin-top: 32rpx;
  padding: 24rpx;
  background-color: #1CB0F6;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  box-shadow: 0 4px 12px rgba(28, 176, 246, 0.3);
}

.share-copy-icon {
  width: 32rpx;
  height: 32rpx;
  color: #ffffff;
}

.share-copy-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
}

/* ===========================================
 * Support Chat Modal
 * =========================================== */
.support-modal-card {
  background-color: #ffffff;
  border-radius: 48rpx;
  width: 100%;
  max-width: 700rpx;
  height: 960rpx;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  position: relative;
  border: 1rpx solid #f3f4f6;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.support-header {
  padding: 32rpx;
  background-color: #1e293b;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 1rpx solid rgba(51, 65, 85, 0.6);
}

.support-header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.support-online-dot {
  width: 20rpx;
  height: 20rpx;
  background-color: #22c55e;
  border-radius: 50%;
}

.support-header-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
}

.support-header-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
}

.support-header-close .modal-close-svg {
  color: #9ca3af;
}

/* Chat messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 32rpx;
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.chat-msg-wrap {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.chat-msg-left {
  align-self: flex-start;
  align-items: flex-start;
}

.chat-msg-right {
  align-self: flex-end;
  align-items: flex-end;
}

.chat-bubble {
  padding: 24rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  line-height: 1.6;
  white-space: pre-line;
}

.chat-bubble-bot {
  background-color: #ffffff;
  border: 1rpx solid #e5e7eb;
  color: #1f2937;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border-top-left-radius: 4rpx;
}

.chat-bubble-user {
  background-color: #3B82F6;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
  border-top-right-radius: 4rpx;
}

.chat-bubble-text {
  font-size: 24rpx;
  line-height: 1.6;
}

.chat-timestamp {
  font-size: 18rpx;
  color: #a1a1aa;
  font-family: monospace;
  margin-top: 8rpx;
  padding: 0 8rpx;
}

/* Chat input bar */
.chat-input-bar {
  padding: 24rpx;
  background-color: #ffffff;
  border-top: 1rpx solid #f3f4f6;
  display: flex;
  gap: 16rpx;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  border: 1rpx solid #e4e4e7;
  border-radius: 24rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  color: #1f2937;
  background-color: #f9fafb;
}

.chat-input-placeholder {
  color: #a1a1aa;
  font-size: 24rpx;
}

.chat-send-btn {
  width: 80rpx;
  height: 80rpx;
  background-color: #3B82F6;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.chat-send-icon {
  width: 32rpx;
  height: 32rpx;
  color: #ffffff;
}
</style>
