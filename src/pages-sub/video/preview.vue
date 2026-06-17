<template>
  <view class="page">
    <!-- Video preview -->
    <view class="video-card">
      <video :src="videoPath" class="video-player" controls></video>

      <!-- Custom region selector overlay -->
      <view
        v-if="subtitlePosition === 'custom'"
        class="region-overlay"
      >
        <!-- Dimmed background outside selection -->
        <view class="region-mask"></view>

        <!-- The selectable draggable area -->
        <movable-area class="region-movable-area">
          <movable-view
            class="region-movable-view"
            :x="regionX"
            :y="regionY"
            :width="regionW"
            :height="regionH"
            direction="all"
            :damping="40"
            :friction="10"
            @change="onRegionMove"
            @scale="onRegionScale"
          >
            <!-- Border display -->
            <view class="region-border">
              <!-- Corner handles -->
              <view class="corner corner-tl" @tap.stop.prevent="() => {}" @touchstart.stop.prevent="onCornerStart($event, 'tl')" @touchmove.stop.prevent="onCornerMove($event, 'tl')" @touchend.stop.prevent="onCornerEnd"></view>
              <view class="corner corner-tr" @tap.stop.prevent="() => {}" @touchstart.stop.prevent="onCornerStart($event, 'tr')" @touchmove.stop.prevent="onCornerMove($event, 'tr')" @touchend.stop.prevent="onCornerEnd"></view>
              <view class="corner corner-bl" @tap.stop.prevent="() => {}" @touchstart.stop.prevent="onCornerStart($event, 'bl')" @touchmove.stop.prevent="onCornerMove($event, 'bl')" @touchend.stop.prevent="onCornerEnd"></view>
              <view class="corner corner-br" @tap.stop.prevent="() => {}" @touchstart.stop.prevent="onCornerStart($event, 'br')" @touchmove.stop.prevent="onCornerMove($event, 'br')" @touchend.stop.prevent="onCornerEnd"></view>

              <!-- Crosshair lines -->
              <view class="cross-h"></view>
              <view class="cross-v"></view>
            </view>
          </movable-view>
        </movable-area>

        <!-- Coordinate info bar -->
        <view v-if="regionConfirmed" class="region-info-bar">
          <text class="region-info-text">已确认区域</text>
          <view class="region-coords">
            <text class="coord-item">X: {{ Math.round(regionRatio.x * 100) }}%</text>
            <text class="coord-item">Y: {{ Math.round(regionRatio.y * 100) }}%</text>
            <text class="coord-item">宽: {{ Math.round(regionRatio.width * 100) }}%</text>
            <text class="coord-item">高: {{ Math.round(regionRatio.height * 100) }}%</text>
          </view>
        </view>

        <!-- Confirm button -->
        <view class="region-actions" v-if="!regionConfirmed">
          <view class="region-coords-preview">
            <text class="coord-item">X: {{ Math.round(regionRatio.x * 100) }}%</text>
            <text class="coord-item">Y: {{ Math.round(regionRatio.y * 100) }}%</text>
            <text class="coord-item">宽: {{ Math.round(regionRatio.width * 100) }}%</text>
            <text class="coord-item">高: {{ Math.round(regionRatio.height * 100) }}%</text>
          </view>
          <button class="btn-confirm-region" @tap="confirmRegion">确认区域</button>
        </view>

        <!-- Edit button when confirmed -->
        <view class="region-edit-bar" v-if="regionConfirmed">
          <button class="btn-edit-region" @tap="editRegion">重新选择</button>
        </view>
      </view>
    </view>

    <!-- Task info -->
    <view class="section">
      <text class="section-title">任务信息</text>
      <view class="card">
        <view class="info-row">
          <text class="info-label">任务类型</text>
          <text class="info-value">{{ taskType === 'subtitle' ? '去除字幕' : '去除图标' }}</text>
        </view>
        <view class="info-divider"></view>
        <view class="info-row" v-if="taskType === 'subtitle'">
          <text class="info-label">字幕位置</text>
          <text class="info-value">{{ positionLabel }}</text>
        </view>
        <view class="info-divider" v-if="subtitlePosition === 'custom' && regionConfirmed"></view>
        <view class="info-row" v-if="subtitlePosition === 'custom' && regionConfirmed">
          <text class="info-label">自定义区域</text>
          <text class="info-value region-summary">{{ regionSummaryText }}</text>
        </view>
      </view>
    </view>

    <!-- Actions -->
    <view class="actions">
      <button
        class="btn-primary"
        @tap="startProcess"
        :disabled="isProcessing || (subtitlePosition === 'custom' && !regionConfirmed)"
      >
        {{ isProcessing ? '提交中...' : '开始处理' }}
      </button>
      <button class="btn-secondary" @tap="goBack">返回重新选择</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTaskStore } from '@/store/task';

const taskStore = useTaskStore();

const videoPath = ref('');
const fileId = ref('');
const taskType = ref<'subtitle' | 'icon'>('subtitle');
const subtitlePosition = ref('bottom');
const isProcessing = ref(false);

// --- Custom region selector state ---
const VIDEO_WIDTH = 750; // rpx, matches video-player width (100% screen)
const VIDEO_HEIGHT = 440; // rpx, 220px * 2 = 440rpx

// Default region: centered 60% width, 20% height at bottom
const regionConfirmed = ref(false);

// Region position and size in rpx
const region = reactive({
  x: 150, // (750 - 450) / 2
  y: 320, // near bottom
  width: 450, // 60% of 750
  height: 80, // ~18% of 440
});

// Ratio representation (0~1) for API
const regionRatio = computed(() => ({
  x: region.x / VIDEO_WIDTH,
  y: region.y / VIDEO_HEIGHT,
  width: region.width / VIDEO_WIDTH,
  height: region.height / VIDEO_HEIGHT,
}));

// Summary text for display
const regionSummaryText = computed(() => {
  const r = regionRatio.value;
  return `X:${Math.round(r.x * 100)}% Y:${Math.round(r.y * 100)}% ${Math.round(r.width * 100)}%x${Math.round(r.height * 100)}%`;
});

// Bindings for movable-view (rpx values)
const regionX = computed(() => region.x);
const regionY = computed(() => region.y);
const regionW = computed(() => region.width);
const regionH = computed(() => region.height);

// Track corner drag state
let cornerDragState: {
  corner: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
} | null = null;

function onRegionMove(e: any) {
  // movable-view reports its position after drag
  const detail = e.detail;
  if (detail.x !== undefined && detail.y !== undefined) {
    region.x = Math.max(0, Math.min(detail.x, VIDEO_WIDTH - region.width));
    region.y = Math.max(0, Math.min(detail.y, VIDEO_HEIGHT - region.height));
  }
}

function onRegionScale(_e: any) {
  // scale not used for region, handled by corner drag
}

function onCornerStart(e: TouchEvent, corner: string) {
  const touch = e.touches[0];
  cornerDragState = {
    corner,
    startX: touch.clientX,
    startY: touch.clientY,
    origX: region.x,
    origY: region.y,
    origW: region.width,
    origH: region.height,
  };
}

function pxToRpx(px: number): number {
  // Approximate: 750rpx = screen width. We use systemInfo for accurate conversion.
  const info = uni.getSystemInfoSync();
  return (px / info.windowWidth) * 750;
}

function onCornerMove(e: TouchEvent, corner: string) {
  if (!cornerDragState || cornerDragState.corner !== corner) return;
  const touch = e.touches[0];
  const dxRpx = pxToRpx(touch.clientX - cornerDragState.startX);
  const dyRpx = pxToRpx(touch.clientY - cornerDragState.startY);

  const MIN_SIZE = 40; // minimum 40rpx

  let newX = cornerDragState.origX;
  let newY = cornerDragState.origY;
  let newW = cornerDragState.origW;
  let newH = cornerDragState.origH;

  switch (corner) {
    case 'br': // bottom-right: resize only
      newW = Math.max(MIN_SIZE, cornerDragState.origW + dxRpx);
      newH = Math.max(MIN_SIZE, cornerDragState.origH + dyRpx);
      break;
    case 'bl': // bottom-left: move x, resize w+h
      newW = Math.max(MIN_SIZE, cornerDragState.origW - dxRpx);
      newX = cornerDragState.origX + (cornerDragState.origW - newW);
      newH = Math.max(MIN_SIZE, cornerDragState.origH + dyRpx);
      break;
    case 'tr': // top-right: move y, resize w+h
      newH = Math.max(MIN_SIZE, cornerDragState.origH - dyRpx);
      newY = cornerDragState.origY + (cornerDragState.origH - newH);
      newW = Math.max(MIN_SIZE, cornerDragState.origW + dxRpx);
      break;
    case 'tl': // top-left: move x+y, resize w+h
      newW = Math.max(MIN_SIZE, cornerDragState.origW - dxRpx);
      newX = cornerDragState.origX + (cornerDragState.origW - newW);
      newH = Math.max(MIN_SIZE, cornerDragState.origH - dyRpx);
      newY = cornerDragState.origY + (cornerDragState.origH - newH);
      break;
  }

  // Clamp within bounds
  newX = Math.max(0, Math.min(newX, VIDEO_WIDTH - MIN_SIZE));
  newY = Math.max(0, Math.min(newY, VIDEO_HEIGHT - MIN_SIZE));
  newW = Math.min(newW, VIDEO_WIDTH - newX);
  newH = Math.min(newH, VIDEO_HEIGHT - newY);

  region.x = newX;
  region.y = newY;
  region.width = newW;
  region.height = newH;
}

function onCornerEnd() {
  cornerDragState = null;
}

function confirmRegion() {
  regionConfirmed.value = true;
  uni.showToast({ title: '区域已确认', icon: 'success', duration: 1000 });
}

function editRegion() {
  regionConfirmed.value = false;
}

// --- End custom region ---

const positionLabel = computed(() => {
  const map: Record<string, string> = { bottom: '底部', top: '顶部', custom: '自定义' };
  return map[subtitlePosition.value] || '底部';
});

onLoad((options) => {
  if (options?.videoPath) {
    videoPath.value = decodeURIComponent(options.videoPath);
  }
  if (options?.fileId) {
    fileId.value = options.fileId;
  }
  if (options?.type) {
    taskType.value = options.type as 'subtitle' | 'icon';
  }
  if (options?.position) {
    subtitlePosition.value = options.position;
  }
});

async function startProcess() {
  if (subtitlePosition.value === 'custom' && !regionConfirmed.value) {
    uni.showToast({ title: '请先确认自定义区域', icon: 'none' });
    return;
  }

  isProcessing.value = true;
  try {
    let regionParam: Record<string, any> | undefined;

    if (subtitlePosition.value === 'custom') {
      // Use ratio-based region for API (0~1 normalized)
      regionParam = {
        x: Math.round(regionRatio.value.x * 1000) / 1000,
        y: Math.round(regionRatio.value.y * 1000) / 1000,
        width: Math.round(regionRatio.value.width * 1000) / 1000,
        height: Math.round(regionRatio.value.height * 1000) / 1000,
      };
    } else {
      regionParam = { position: subtitlePosition.value };
    }

    const task = await taskStore.createTask(videoPath.value, taskType.value, regionParam);
    uni.navigateTo({
      url: `/pages-sub/video/processing?taskId=${task.id}`,
    });
  } catch (err: any) {
    uni.showToast({ title: err.message || '创建任务失败', icon: 'none' });
  } finally {
    isProcessing.value = false;
  }
}

function goBack() {
  uni.navigateBack();
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--space-4);
}

/* Video card */
.video-card {
  position: relative;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
  margin-bottom: var(--space-4);
}
.video-player {
  width: 100%;
  height: 220px;
  display: block;
}

/* --- Custom Region Selector --- */
.region-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 220px;
  z-index: 10;
}

.region-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.35);
}

.region-movable-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 11;
}

.region-movable-view {
  width: 225px;
  height: 40px;
}

.region-border {
  width: 100%;
  height: 100%;
  border: 2px solid var(--color-primary);
  box-sizing: border-box;
  position: relative;
  background: rgba(255, 255, 255, 0.08);
}

/* Crosshair lines */
.cross-h {
  position: absolute;
  top: 50%;
  left: 10%;
  width: 80%;
  height: 0.5px;
  background: var(--color-primary);
  opacity: 0.4;
}
.cross-v {
  position: absolute;
  left: 50%;
  top: 10%;
  width: 0.5px;
  height: 80%;
  background: var(--color-primary);
  opacity: 0.4;
}

/* Corner handles */
.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  z-index: 12;
}

.corner-tl {
  top: -12px;
  left: -12px;
  border-top: 3px solid var(--color-primary);
  border-left: 3px solid var(--color-primary);
}
.corner-tr {
  top: -12px;
  right: -12px;
  border-top: 3px solid var(--color-primary);
  border-right: 3px solid var(--color-primary);
}
.corner-bl {
  bottom: -12px;
  left: -12px;
  border-bottom: 3px solid var(--color-primary);
  border-left: 3px solid var(--color-primary);
}
.corner-br {
  bottom: -12px;
  right: -12px;
  border-bottom: 3px solid var(--color-primary);
  border-right: 3px solid var(--color-primary);
}

/* Coordinate info bar */
.region-info-bar {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  z-index: 13;
  background: rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.region-info-text {
  font-size: 12px;
  color: #4CAF50;
  font-weight: 600;
}

.region-coords,
.region-coords-preview {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.coord-item {
  font-size: 11px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 6px;
  border-radius: 3px;
}

/* Confirm / Edit buttons */
.region-actions {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  z-index: 13;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.region-coords-preview {
  flex: 1;
  flex-wrap: nowrap;
  overflow: hidden;
}
.region-coords-preview .coord-item {
  white-space: nowrap;
}

.btn-confirm-region {
  flex-shrink: 0;
  height: 32px;
  line-height: 32px;
  padding: 0 14px;
  background: var(--color-primary);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: none;
  white-space: nowrap;
}

.region-edit-bar {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  z-index: 13;
  display: flex;
  justify-content: center;
}

.btn-edit-region {
  height: 30px;
  line-height: 30px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.4);
  white-space: nowrap;
}

/* --- End Custom Region Selector --- */

/* Section */
.section {
  margin-bottom: var(--space-4);
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
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
}
.info-label {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}
.info-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}
.region-summary {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-family: monospace;
}
.info-divider {
  height: 0.5px;
  background: var(--color-separator);
  margin-left: var(--space-4);
}

/* Actions */
.actions {
  margin-top: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.btn-primary {
  width: 100%;
  height: var(--btn-height-lg);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-primary[disabled] {
  opacity: 0.5;
}
.btn-secondary {
  width: 100%;
  height: var(--btn-height-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-separator);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
