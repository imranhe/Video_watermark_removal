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
        <!-- 关键：必须使用 open-type="agreePrivacyAuthorization" 并设置 id -->
        <button
          class="btn-agree"
          id="agree-btn"
          open-type="agreePrivacyAuthorization"
          @agreeprivacyauthorization="handleAgree"
        >
          同意并继续
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const show = ref(false);
let privacyResolve: ((value: { buttonId: string; event: string }) => void) | null = null;

onMounted(() => {
  // 监听隐私授权事件 — 微信官方 API
  // #ifdef MP-WEIXIN
  uni.onNeedPrivacyAuthorization((resolve) => {
    privacyResolve = resolve;
    show.value = true;
  });
  // #endif
});

defineExpose({
  showPrivacyDialog() {
    show.value = true;
  }
});

function handleAgree() {
  if (privacyResolve) {
    privacyResolve({ buttonId: 'agree-btn', event: 'agree' });
  }
  uni.setStorageSync('privacy_agreed', true);
  show.value = false;
}

function handleDisagree() {
  if (privacyResolve) {
    privacyResolve({ event: 'disagree' });
  }
  show.value = false;
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
</script>

<style scoped>
.privacy-dialog {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: var(--z-modal);
}
.dialog-mask {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}
.dialog-content {
  position: relative;
  margin: 20% var(--space-8);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
}
.dialog-header {
  text-align: center;
  margin-bottom: var(--space-4);
}
.dialog-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.dialog-body {
  margin-bottom: var(--space-6);
}
.dialog-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}
.dialog-links {
  margin-top: var(--space-3);
  display: flex;
  gap: var(--space-2);
}
.link {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
}
.dialog-footer {
  display: flex;
  gap: var(--space-3);
}
.btn-disagree {
  flex: 1;
  height: var(--btn-height-md);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-agree {
  flex: 1;
  height: var(--btn-height-md);
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
