<template>
  <view class="page">
    <view class="hero">
      <view class="hero-icon">字</view>
      <text class="hero-title">视频去字幕</text>
      <text class="hero-version">Version 1.0.0</text>
    </view>

    <view class="section">
      <text class="section-title">功能介绍</text>
      <view class="card">
        <view class="feature-row">
          <view class="feature-dot" style="background:#007AFF"></view>
          <view class="feature-content">
            <text class="feature-name">智能去字幕</text>
            <text class="feature-desc">基于 AI 算法自动识别并去除视频字幕</text>
          </view>
        </view>
        <view class="divider"></view>
        <view class="feature-row">
          <view class="feature-dot" style="background:#FF9500"></view>
          <view class="feature-content">
            <text class="feature-name">去除水印</text>
            <text class="feature-desc">精准定位并清除视频中的图标水印</text>
          </view>
        </view>
        <view class="divider"></view>
        <view class="feature-row">
          <view class="feature-dot" style="background:#34C759"></view>
          <view class="feature-content">
            <text class="feature-name">高速处理</text>
            <text class="feature-desc">云端渲染引擎，处理速度快、画质无损</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">更多</text>
      <view class="card">
        <view class="link-row" @tap="openPrivacy">
          <text class="link-text">隐私政策</text>
          <text class="link-arrow">›</text>
        </view>
        <view class="divider"></view>
        <view class="link-row" @tap="openTerms">
          <text class="link-text">用户服务协议</text>
          <text class="link-arrow">›</text>
        </view>
        <view class="divider"></view>
        <view class="link-row" @tap="openFeedback">
          <text class="link-text">意见反馈</text>
          <text class="link-arrow">›</text>
        </view>
      </view>
    </view>

    <text class="copyright">Copyright 2026 视频去字幕</text>
  </view>
</template>

<script setup lang="ts">
function openPrivacy() {
  uni.navigateTo({ url: '/pages/privacy/privacy' });
}
function openTerms() {
  uni.navigateTo({ url: '/pages/terms/terms' });
}
function openFeedback() {
  uni.navigateTo({ url: '/pages/feedback/feedback' });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 0 0 var(--space-8);
}

/* Hero */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12) 0 var(--space-8);
}
.hero-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-xl);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-3);
}
.hero-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}
.hero-version {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Section */
.section {
  padding: 0 var(--space-4);
  margin-bottom: var(--space-6);
}
.section-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 var(--space-4) var(--space-2);
}

/* Card */
.card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

/* Feature rows */
.feature-row {
  display: flex;
  align-items: flex-start;
  padding: var(--space-4);
  gap: var(--space-3);
}
.feature-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  margin-top: 5px;
  flex-shrink: 0;
}
.feature-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.feature-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.feature-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}
.divider {
  height: 0.5px;
  background: var(--color-separator);
  margin-left: var(--space-4);
}

/* Link rows */
.link-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
}
.link-text {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}
.link-arrow {
  font-size: var(--font-size-xl);
  color: var(--color-text-quaternary);
  line-height: 1;
}

/* Copyright */
.copyright {
  display: block;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-8);
}
</style>
