<template>
  <view class="privacy-dialog" v-if="show">
    <view class="dialog-mask"></view>
    <view class="dialog-content">
      <view class="dialog-header">
        <text class="dialog-title">隐私保护提示</text>
      </view>
      <view class="dialog-body">
        <text class="dialog-text">
          感谢您选择使用本小程序。在使用前，请您仔细阅读并了解《隐私政策》和《用户服务协议》的全部内容。
        </text>
        <view class="dialog-links">
          <text class="link" @tap="openPrivacyPolicy">《隐私政策》</text>
          <text class="link" @tap="openTerms">《用户服务协议》</text>
        </view>
      </view>
      <view class="dialog-footer">
        <button class="btn-disagree" @tap="handleDisagree">不同意</button>
        <button class="btn-agree" @tap="handleAgree">同意并继续</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const show = ref(false);

function showPrivacyDialog() {
  show.value = true;
}

function handleAgree() {
  uni.setStorageSync('privacy_agreed', true);
  show.value = false;
}

function handleDisagree() {
  uni.showModal({
    title: '提示',
    content: '如果您不同意隐私政策，将无法使用本小程序的全部功能。',
    showCancel: false
  });
}

function openPrivacyPolicy() {
  uni.navigateTo({ url: '/pages/privacy/privacy' });
}

function openTerms() {
  uni.navigateTo({ url: '/pages/terms/terms' });
}

defineExpose({ showPrivacyDialog });
</script>

<style scoped>
.privacy-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}
.dialog-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}
.dialog-content {
  position: relative;
  margin: 20% 40px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.dialog-header {
  text-align: center;
  margin-bottom: 15px;
}
.dialog-title {
  font-size: 18px;
  font-weight: bold;
}
.dialog-body {
  margin-bottom: 20px;
}
.dialog-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}
.dialog-links {
  margin-top: 10px;
}
.link {
  color: #007AFF;
  font-size: 14px;
}
.dialog-footer {
  display: flex;
  gap: 10px;
}
.btn-disagree {
  flex: 1;
  height: 40px;
  background: #f5f5f5;
  color: #666;
  border-radius: 20px;
}
.btn-agree {
  flex: 1;
  height: 40px;
  background: #007AFF;
  color: #fff;
  border-radius: 20px;
}
</style>
