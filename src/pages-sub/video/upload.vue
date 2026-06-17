<template>
  <view class="page">
    <!-- Task type badge -->
    <view class="type-section">
      <view class="type-badge" :class="taskType">
        <text class="badge-char">{{ taskType === 'subtitle' ? '字' : '印' }}</text>
      </view>
      <text class="type-label">{{ taskType === 'subtitle' ? '去除字幕' : '去除图标' }}</text>
    </view>

    <VideoUploader
      :max-size="100"
      :auto-upload="false"
      @select="handleVideoSelect"
      @upload-start="handleUploadStart"
      @upload-progress="handleUploadProgress"
      @upload-success="handleUploadSuccess"
      @upload-error="handleUploadError"
    />

    <!-- Processing options -->
    <view v-if="selectedVideo" class="section">
      <text class="section-title">处理选项</text>
      <view class="card" v-if="taskType === 'subtitle'">
        <view class="option-row">
          <text class="option-label">字幕位置</text>
          <view class="option-chips">
            <view
              class="chip"
              :class="{ active: subtitlePosition === 'bottom' }"
              @tap="subtitlePosition = 'bottom'"
            >
              <text class="chip-text">底部</text>
            </view>
            <view
              class="chip"
              :class="{ active: subtitlePosition === 'top' }"
              @tap="subtitlePosition = 'top'"
            >
              <text class="chip-text">顶部</text>
            </view>
            <view
              class="chip"
              :class="{ active: subtitlePosition === 'custom' }"
              @tap="subtitlePosition = 'custom'"
            >
              <text class="chip-text">自定义</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import VideoUploader from '@/components/VideoUploader.vue';

const taskType = ref<'subtitle' | 'icon'>('subtitle');
const selectedVideo = ref<any>(null);
const subtitlePosition = ref<'bottom' | 'top' | 'custom'>('bottom');
const isUploading = ref(false);

onLoad((options) => {
  if (options?.type) {
    taskType.value = options.type as 'subtitle' | 'icon';
  }
});

function handleVideoSelect(video: any) {
  selectedVideo.value = video;
}
function handleUploadStart() {
  isUploading.value = true;
}
function handleUploadProgress(progress: any) {
  console.log('上传进度:', progress.percent);
}
function handleUploadSuccess(result: any) {
  isUploading.value = false;
  const videoPath = selectedVideo.value?.path || '';
  uni.navigateTo({
    url: `/pages-sub/video/preview?fileId=${result.fileId || ''}&type=${taskType.value}&position=${subtitlePosition.value}&videoPath=${encodeURIComponent(videoPath)}`,
  });
}
function handleUploadError(error: string) {
  isUploading.value = false;
  uni.showToast({ title: error, icon: 'none' });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--space-6) var(--space-4) var(--space-8);
}

/* Type section */
.type-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--space-6);
}
.type-badge {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-2);
}
.type-badge.subtitle {
  background: var(--color-primary-light);
}
.type-badge.icon {
  background: var(--color-warning-light);
}
.badge-char {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}
.type-badge.icon .badge-char {
  color: var(--color-warning);
}
.type-label {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* Section */
.section {
  margin-top: var(--space-6);
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
  padding: var(--space-4);
  box-shadow: var(--shadow-xs);
}
.option-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.option-label {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
.option-chips {
  display: flex;
  gap: var(--space-2);
}
.chip {
  flex: 1;
  height: var(--btn-height-md);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}
.chip.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}
.chip-text {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}
.chip.active .chip-text {
  color: var(--color-primary);
}
</style>
