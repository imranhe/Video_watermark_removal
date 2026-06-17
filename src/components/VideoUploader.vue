<template>
  <view class="video-uploader">
    <view class="upload-area" :class="{ 'has-video': videoInfo }" @tap="handleSelectVideo">
      <view v-if="!videoInfo" class="upload-placeholder">
        <view class="upload-icon-wrap">
          <text class="upload-icon-char">+</text>
        </view>
        <text class="upload-text">点击选择视频</text>
        <text class="upload-hint">支持 MP4、MOV 格式，最大 {{ maxSize }}MB</text>
      </view>
      <view v-else class="video-preview">
        <video :src="videoInfo.path" class="video-player" controls :show-fullscreen-btn="false"></video>
        <view class="video-info">
          <text class="video-name">{{ videoName }}</text>
          <text class="video-size">{{ formatSize(videoInfo.size) }}</text>
        </view>
      </view>
    </view>

    <view v-if="isUploading || isPaused" class="progress-section">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: `${progress.percent}%` }"></view>
      </view>
      <view class="progress-info">
        <text class="progress-percent">{{ progress.percent }}%</text>
        <text class="progress-speed">{{ formatSpeed(progress.speed) }}</text>
      </view>
      <view class="progress-actions">
        <button v-if="isUploading" class="btn-pause" @tap="pauseUpload">暂停</button>
        <button v-if="isPaused" class="btn-resume" @tap="resumeUpload">继续</button>
      </view>
    </view>

    <view v-if="isCompleted" class="complete-section">
      <view class="complete-icon-wrap">
        <text class="complete-char">✓</text>
      </view>
      <text class="complete-text">上传完成</text>
    </view>

    <view v-if="hasError && error" class="error-section">
      <view class="error-icon-wrap">
        <text class="error-char">!</text>
      </view>
      <text class="error-text">{{ error }}</text>
      <button class="btn-retry" @tap="reset">重新选择</button>
    </view>

    <view v-if="videoInfo && !isUploading && !isCompleted" class="action-buttons">
      <button class="btn-upload" :disabled="!videoInfo" @tap="handleStartUpload">开始上传</button>
      <button class="btn-reset" @tap="reset">重新选择</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useVideoUpload } from '@/utils/upload';
import { formatSize, formatSpeed } from '@/utils/format';

interface Props {
  maxSize?: number;
  autoUpload?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxSize: 100,
  autoUpload: false,
});

const emit = defineEmits<{
  (e: 'select', video: any): void;
  (e: 'upload-start'): void;
  (e: 'upload-progress', progress: any): void;
  (e: 'upload-success', result: any): void;
  (e: 'upload-error', error: string): void;
}>();

const {
  status, videoInfo, progress, error,
  isUploading, isPaused, isCompleted, hasError,
  selectVideo, startUpload, pauseUpload, resumeUpload, reset,
} = useVideoUpload({ maxFileSize: props.maxSize });

const videoName = computed(() => {
  if (!videoInfo.value) return '';
  return videoInfo.value.path.split('/').pop() || 'video.mp4';
});

async function handleSelectVideo() {
  if (isUploading.value || isCompleted.value) return;
  const video = await selectVideo();
  if (video) {
    emit('select', video);
    if (props.autoUpload) handleStartUpload();
  }
}

async function handleStartUpload() {
  emit('upload-start');
  try {
    const result = await startUpload();
    emit('upload-success', result);
  } catch (err: any) {
    emit('upload-error', err.message);
  }
}

watch(progress, (newProgress) => {
  emit('upload-progress', newProgress);
}, { deep: true });
</script>

<style scoped>
.video-uploader { width: 100%; }
.upload-area {
  background: var(--color-bg-secondary);
  border: 2px dashed var(--color-separator);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all var(--transition-fast);
}
.upload-area:active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.upload-area.has-video {
  border-style: solid;
  border-color: var(--color-primary);
}
.upload-placeholder {
  padding: var(--space-16) var(--space-4);
  text-align: center;
}
.upload-icon-wrap {
  width: 56px; height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-bg-tertiary);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto var(--space-4);
}
.upload-icon-char {
  font-size: var(--font-size-3xl);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-light);
}
.upload-text {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}
.upload-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}
.video-preview { position: relative; }
.video-player { width: 100%; height: 200px; }
.video-info {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-tertiary);
  display: flex; justify-content: space-between; align-items: center;
}
.video-name {
  font-size: var(--font-size-sm); color: var(--color-text-primary);
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.video-size { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-left: var(--space-3); }

.progress-section { margin-top: var(--space-5); }
.progress-bar { height: 4px; background: var(--color-separator); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width var(--transition-normal); }
.progress-info { display: flex; justify-content: space-between; margin-top: var(--space-2); }
.progress-percent { font-size: var(--font-size-xs); color: var(--color-primary); font-weight: var(--font-weight-medium); }
.progress-speed { font-size: var(--font-size-xs); color: var(--color-text-tertiary); }
.progress-actions { margin-top: var(--space-3); display: flex; gap: var(--space-3); }
.btn-pause, .btn-resume {
  flex: 1; height: var(--btn-height-sm);
  border-radius: var(--radius-sm); border: none;
  font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
  display: flex; align-items: center; justify-content: center;
}
.btn-pause { background: var(--color-bg-tertiary); color: var(--color-text-secondary); }
.btn-resume { background: var(--color-primary); color: #fff; }

.complete-section {
  text-align: center; padding: var(--space-6) 0;
  display: flex; flex-direction: column; align-items: center;
}
.complete-icon-wrap {
  width: 40px; height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-success);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: var(--space-2);
}
.complete-char { font-size: var(--font-size-lg); color: #fff; font-weight: var(--font-weight-bold); }
.complete-text { font-size: var(--font-size-base); color: var(--color-success); font-weight: var(--font-weight-medium); }

.error-section {
  text-align: center; padding: var(--space-6) 0;
  display: flex; flex-direction: column; align-items: center;
}
.error-icon-wrap {
  width: 40px; height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-error-light);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: var(--space-2);
}
.error-char { font-size: var(--font-size-lg); color: var(--color-error); font-weight: var(--font-weight-bold); }
.error-text { font-size: var(--font-size-sm); color: var(--color-error); margin-bottom: var(--space-3); }
.btn-retry {
  width: 120px; height: var(--btn-height-sm);
  background: var(--color-error); color: #fff;
  font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm); border: none;
  display: inline-flex; align-items: center; justify-content: center;
}

.action-buttons { margin-top: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
.btn-upload {
  width: 100%; height: var(--btn-height-lg);
  background: var(--color-primary); color: #fff;
  font-size: var(--font-size-md); font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md); border: none;
  display: flex; align-items: center; justify-content: center;
}
.btn-upload[disabled] { opacity: 0.5; }
.btn-reset {
  width: 100%; height: var(--btn-height-md);
  background: transparent; color: var(--color-text-secondary);
  font-size: var(--font-size-base); font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md); border: 1px solid var(--color-separator);
  display: flex; align-items: center; justify-content: center;
}
</style>
