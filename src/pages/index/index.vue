<template>
  <view class="page">
    <!-- 上传卡片 -->
    <view class="upload-card" @tap="handleUpload">
      <!-- 装饰图标 -->
      <view class="sparkle-deco"></view>

      <view class="upload-icon-wrap">
        <text class="upload-icon">+</text>
      </view>

      <text class="upload-title">上传视频或图片</text>
      <text class="upload-hint">MP4/MOV/AVI · 180秒内 · 300MB以内</text>
    </view>

    <!-- 工具按钮网格 -->
    <view class="tool-grid">
      <view class="tool-card" @tap="goToLinkParse">
        <view class="tool-icon-wrap tool-icon-link-bg">
          <text class="tool-icon-text tool-icon-link-color">链</text>
        </view>
        <view class="tool-label-wrap">
          <text class="tool-label-line">链接</text>
          <text class="tool-label-line">去水印</text>
        </view>
      </view>

      <view class="tool-card" @tap="goToImageRemove">
        <view class="tool-icon-wrap tool-icon-image-bg">
          <text class="tool-icon-text tool-icon-image-color">图</text>
        </view>
        <view class="tool-label-wrap">
          <text class="tool-label-line">图片</text>
          <text class="tool-label-line">去水印</text>
        </view>
      </view>

      <view class="tool-card" @tap="goToSubtitle">
        <view class="tool-icon-wrap tool-icon-video-bg">
          <text class="tool-icon-text tool-icon-video-color">视</text>
        </view>
        <view class="tool-label-wrap">
          <text class="tool-label-line">视频</text>
          <text class="tool-label-line">字幕</text>
        </view>
      </view>
    </view>

    <!-- 前后对比区 -->
    <view class="compare-section">
      <view class="compare-header">
        <text class="compare-title">处理前后对比</text>
        <text class="compare-badge">演示案例</text>
      </view>

      <!-- 2 列 grid 布局 -->
      <view class="compare-grid">
        <!-- Before -->
        <view class="compare-card">
          <view class="compare-img-wrap">
            <image
              class="compare-img"
              src="https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=300&q=80"
              mode="aspectFill"
            />
            <view class="watermark-overlay">
              <text class="watermark-overlay-text">Watermark.com</text>
            </view>
          </view>
          <text class="compare-caption">Before</text>
        </view>

        <!-- After -->
        <view class="compare-card">
          <view class="compare-img-wrap">
            <image
              class="compare-img"
              src="https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=300&q=80"
              mode="aspectFill"
            />
          </view>
          <text class="compare-caption">After</text>
        </view>
      </view>

      <!-- 交互滑块 -->
      <view class="slider-section">
        <text class="slider-label">拖拽对比滑块查看效果：</text>
        <view
          class="slider-container"
          id="sliderContainer"
          @touchstart="onSliderTouchStart"
          @touchmove.prevent="onSliderTouchMove"
        >
          <!-- Before Layer (background) -->
          <view class="slider-layer-before">
            <image
              class="slider-img"
              src="https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=600&q=80"
              mode="aspectFill"
            />
            <view class="slider-watermark-overlay">
              <text class="slider-watermark-text">Watermark.com</text>
            </view>
          </view>

          <!-- After Layer (sliding clip) -->
          <view class="slider-layer-after" :style="{ width: sliderPosition + '%' }">
            <image
              class="slider-img"
              :style="{ width: containerWidth + 'px', height: '100%' }"
              src="https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=600&q=80"
              mode="aspectFill"
            />
          </view>

          <!-- Slider Track + Handle -->
          <view class="slider-track" :style="{ left: sliderPosition + '%' }">
            <view class="slider-track-line"></view>
            <view class="slider-handle">
              <text class="slider-handle-icon">⇔</text>
            </view>
          </view>
        </view>
      </view>

      <view class="compare-footer">
        <text class="compare-desc">AI 自动识别并去除视频中的字幕和水印</text>
      </view>
    </view>

    <!-- 使用说明 -->
    <view class="notice-section">
      <view class="notice-header">
        <text class="notice-title">使用须知</text>
      </view>
      <view class="notice-list">
        <view class="notice-item">
          <text class="notice-dot">•</text>
          <text class="notice-text">支持格式：MP4、MOV、AVI</text>
        </view>
        <view class="notice-item">
          <text class="notice-dot">•</text>
          <text class="notice-text">视频时长：180 秒以内</text>
        </view>
        <view class="notice-item">
          <text class="notice-dot">•</text>
          <text class="notice-text">文件大小：300MB 以内</text>
        </view>
        <view class="notice-item notice-warn">
          <text class="notice-dot">⚠</text>
          <text class="notice-text">文字覆盖密集的视频处理效果较差，建议选择字幕/水印区域较清晰的视频</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onReady } from '@dcloudio/uni-app';

/* =========================================
 * 前后对比滑块状态
 * ========================================= */
const sliderPosition = ref(50);
const containerWidth = ref(300);
let cachedRectLeft = 0;
let cachedRectWidth = 300;

onReady(() => {
  uni
    .createSelectorQuery()
    .select('#sliderContainer')
    .boundingClientRect((rect: any) => {
      if (rect) {
        containerWidth.value = rect.width;
        cachedRectWidth = rect.width;
        cachedRectLeft = rect.left;
      }
    })
    .exec();
});

function onSliderTouchStart(e: any) {
  const touch = e.touches?.[0];
  if (!touch) return;
  updateSliderPosition(touch.clientX);
}

function onSliderTouchMove(e: any) {
  const touch = e.touches?.[0];
  if (!touch || cachedRectWidth <= 0) return;
  updateSliderPosition(touch.clientX);
}

function updateSliderPosition(clientX: number) {
  if (cachedRectWidth <= 0) return;
  const position = ((clientX - cachedRectLeft) / cachedRectWidth) * 100;
  sliderPosition.value = Math.max(0, Math.min(100, position));
}

/* =========================================
 * 上传视频/图片
 * ========================================= */
function handleUpload() {
  uni.showActionSheet({
    itemList: ['选择视频', '选择图片'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.chooseVideo({
          sourceType: ['album', 'camera'],
          compressed: true,
          maxDuration: 180,
          success: (videoRes) => {
            uni.navigateTo({
              url: `/pages-sub/video/upload?type=subtitle&filePath=${encodeURIComponent(videoRes.tempFilePath)}`,
            });
          },
        });
      } else {
        uni.chooseImage({
          count: 1,
          sourceType: ['album', 'camera'],
          success: (imgRes) => {
            uni.navigateTo({
              url: `/pages-sub/video/upload?type=icon&filePath=${encodeURIComponent(imgRes.tempFilePaths[0])}`,
            });
          },
        });
      }
    },
  });
}

/* =========================================
 * 跳转：链接去水印
 * ========================================= */
function goToLinkParse() {
  uni.navigateTo({ url: '/pages-sub/video/link-parse' });
}

/* =========================================
 * 跳转：图片去水印
 * ========================================= */
function goToImageRemove() {
  uni.navigateTo({ url: '/pages-sub/video/upload?type=icon' });
}

/* =========================================
 * 跳转：视频字幕
 * ========================================= */
function goToSubtitle() {
  uni.navigateTo({ url: '/pages-sub/video/upload?type=subtitle' });
}
</script>

<style scoped>
/* =============================================
 * 页面容器
 * 对标 React: bg-[#FCFCFD] flex flex-col gap-6
 * ============================================= */
.page {
  min-height: 100vh;
  background: #fcfcfd;
  padding: 24px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* =============================================
 * 上传卡片
 * 对标 React: bg-[#E5F1FF]/60 border-[#CCE3FF] rounded-3xl
 * ============================================= */
.upload-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: rgba(229, 241, 255, 0.6);
  border-radius: 24px;
  border: 1px solid #cce3ff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.sparkle-deco {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 8px;
  height: 8px;
  background: #007AFF;
  border-radius: 50%;
  opacity: 0.4;
}

.upload-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(204, 227, 255, 0.5);
}

.upload-icon {
  font-size: 32px;
  font-weight: 300;
  color: #1cb0f6;
  line-height: 1;
}

.upload-title {
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 10px;
  color: #60a5fa;
  font-weight: 600;
  margin-top: 4px;
  letter-spacing: 0.15em;
  line-height: 1;
}

/* =============================================
 * 工具按钮网格
 * 对标 React: grid-cols-3 gap-3, white bg,
 *   border-gray-150/45, rounded-2xl
 * ============================================= */
.tool-grid {
  display: flex;
  gap: 12px;
}

.tool-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(229, 229, 234, 0.45);
}

/* 图标容器: w-11 h-11 rounded-xl + border */
.tool-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.tool-icon-text {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

/* 链接去水印: #007AFF */
.tool-icon-link-bg {
  background: rgba(0, 122, 255, 0.08);
  border: 1px solid rgba(0, 122, 255, 0.15);
}
.tool-icon-link-color {
  color: #007aff;
}

/* 图片去水印: #1CB0F6 */
.tool-icon-image-bg {
  background: rgba(28, 176, 246, 0.08);
  border: 1px solid rgba(28, 176, 246, 0.15);
}
.tool-icon-image-color {
  color: #1cb0f6;
}

/* 视频字幕: #1B72E8 */
.tool-icon-video-bg {
  background: rgba(27, 114, 232, 0.08);
  border: 1px solid rgba(27, 114, 232, 0.15);
}
.tool-icon-video-color {
  color: #1b72e8;
}

/* 两行中文标签: 对标 React text-[11px] font-black */
.tool-label-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tool-label-line {
  font-size: 11px;
  font-weight: 900;
  line-height: 1.25;
  color: #1e293b;
  text-align: center;
}

/* =============================================
 * 前后对比区
 * 对标 React: Before & After section
 * ============================================= */
.compare-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.compare-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.compare-title {
  font-size: 16px;
  font-weight: 800;
  color: #111111;
}

.compare-badge {
  font-size: 10px;
  color: #3b82f6;
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* 2 列 grid 布局 */
.compare-grid {
  display: flex;
  gap: 12px;
}

.compare-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

/* 方形图片容器: aspect-square, rounded-2xl */
.compare-img-wrap {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  background: #eceff1;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #f3f4f6;
}

.compare-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 水印文字覆盖层 */
.watermark-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 2px 4px;
  background: rgba(30, 41, 59, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.watermark-overlay-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1;
}

.compare-caption {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

/* =============================================
 * 交互滑块区域
 * 对标 React: bg-blue-50/40 rounded-2xl border-blue-100/50
 * ============================================= */
.slider-section {
  padding: 12px;
  background: rgba(239, 246, 255, 0.4);
  border-radius: 16px;
  border: 1px solid rgba(219, 234, 254, 0.5);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-label {
  font-size: 10px;
  font-weight: 800;
  color: #2563eb;
  letter-spacing: 0.05em;
}

/* 滑块容器: bg-[#333], rounded-2xl, ring-2 ring-white */
.slider-container {
  position: relative;
  width: 100%;
  height: 200px;
  background: #333333;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e5ea;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 0 2px #ffffff;
}

/* Before 层 (全幅背景) */
.slider-layer-before {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.slider-img {
  width: 100%;
  height: 100%;
}

/* 滑块内水印文字 */
.slider-watermark-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 8px 16px;
  background: rgba(30, 41, 59, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.slider-watermark-text {
  font-size: 24px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
}

/* After 层 (滑动裁剪) */
.slider-layer-after {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  overflow: hidden;
}

.slider-layer-after .slider-img {
  position: absolute;
  top: 0;
  left: 0;
}

/* 滑块轨道 + 手柄 */
.slider-track {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 32px;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 1px 白色轨道线 */
.slider-track-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: #ffffff;
}

/* 蓝色圆形手柄: 32px, #007AFF, 白色边框 */
.slider-handle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #007aff;
  border: 2px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  z-index: 1;
}

.slider-handle-icon {
  font-size: 14px;
  color: #ffffff;
  line-height: 1;
}

/* =============================================
 * 底部描述
 * ============================================= */
.compare-footer {
  padding: 0 4px;
}

.compare-desc {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  line-height: 1.5;
}

/* =============================================
 * 使用须知
 * ============================================= */
.notice-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(229, 229, 234, 0.45);
}

.notice-header {
  margin-bottom: 12px;
}

.notice-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.notice-dot {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 700;
  line-height: 1.5;
  flex-shrink: 0;
}

.notice-text {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.notice-warn .notice-dot {
  color: #f59e0b;
}

.notice-warn .notice-text {
  color: #b45309;
  font-weight: 500;
}
</style>
