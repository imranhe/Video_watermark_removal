<template>
  <view class="video-uploader">
    <!-- 视频选择区域 -->
    <view
      class="upload-area"
      :class="{ 'has-video': videoInfo }"
      @tap="handleSelectVideo"
    >
      <!-- 无视频时显示 -->
      <view v-if="!videoInfo" class="upload-placeholder">
        <view class="upload-icon">📹</view>
        <view class="upload-text">点击选择视频</view>
        <view class="upload-hint">
          支持 MP4、MOV 格式，最大 {{ maxSize }}MB
        </view>
      </view>

      <!-- 有视频时显示预览 -->
      <view v-else class="video-preview">
        <video
          :src="videoInfo.path"
          class="video-player"
          controls
          :show-fullscreen-btn="false"
        ></video>
        <view class="video-info">
          <text class="video-name">{{ videoName }}</text>
          <text class="video-size">{{ formatSize(videoInfo.size) }}</text>
        </view>
      </view>
    </view>

    <!-- 上传进度 -->
    <view v-if="isUploading || isPaused" class="progress-section">
      <view class="progress-bar">
        <view
          class="progress-fill"
          :style="{ width: `${progress.percent}%` }"
        ></view>
      </view>
      <view class="progress-info">
        <text class="progress-percent">{{ progress.percent }}%</text>
        <text class="progress-speed">{{ formatSpeed(progress.speed) }}</text>
      </view>
      <view class="progress-actions">
        <button
          v-if="isUploading"
          class="btn-pause"
          @tap="pauseUpload"
        >
          暂停
        </button>
        <button
          v-if="isPaused"
          class="btn-resume"
          @tap="resumeUpload"
        >
          继续
        </button>
      </view>
    </view>

    <!-- 上传完成 -->
    <view v-if="isCompleted" class="complete-section">
      <view class="complete-icon">✅</view>
      <view class="complete-text">上传完成</view>
    </view>

    <!-- 错误信息 -->
    <view v-if="hasError && error" class="error-section">
      <view class="error-icon">❌</view>
      <view class="error-text">{{ error }}</view>
      <button class="btn-retry" @tap="reset">重新选择</button>
    </view>

    <!-- 操作按钮 -->
    <view v-if="videoInfo && !isUploading && !isCompleted" class="action-buttons">
      <button
        class="btn-upload"
        :disabled="!videoInfo"
        @tap="handleStartUpload"
      >
        开始上传
      </button>
      <button class="btn-reset" @tap="reset">
        重新选择
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useVideoUpload } from '@/utils/upload';

interface Props {
  maxSize?: number; // 最大文件大小（MB）
  autoUpload?: boolean; // 选择后自动上传
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
  status,
  videoInfo,
  progress,
  error,
  isUploading,
  isPaused,
  isCompleted,
  hasError,
  selectVideo,
  startUpload,
  pauseUpload,
  resumeUpload,
  reset,
} = useVideoUpload({ maxFileSize: props.maxSize });

// 视频名称
const videoName = computed(() => {
  if (!videoInfo.value) return '';
  const path = videoInfo.value.path;
  return path.split('/').pop() || 'video.mp4';
});

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 格式化上传速度
function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) return bytesPerSecond.toFixed(0) + ' B/s';
  if (bytesPerSecond < 1024 * 1024) return (bytesPerSecond / 1024).toFixed(1) + ' KB/s';
  return (bytesPerSecond / (1024 * 1024)).toFixed(1) + ' MB/s';
}

// 选择视频
async function handleSelectVideo() {
  if (isUploading.value || isCompleted.value) return;

  const video = await selectVideo();
  if (video) {
    emit('select', video);

    if (props.autoUpload) {
      handleStartUpload();
    }
  }
}

// 开始上传
async function handleStartUpload() {
  emit('upload-start');

  try {
    const result = await startUpload();
    emit('upload-success', result);
  } catch (err: any) {
    emit('upload-error', err.message);
  }
}

// 监听进度变化
watch(progress, (newProgress) => {
  emit('upload-progress', newProgress);
}, { deep: true });
</script>

<style scoped>
.video-uploader {
  width: 100%;
}

.upload-area {
  background: #fff;
  border: 2px dashed #ddd;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.upload-area:active {
  border-color: #007AFF;
  background: #f8f9ff;
}

.upload-area.has-video {
  border-style: solid;
  border-color: #007AFF;
}

.upload-placeholder {
  padding: 60px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 60px;
  margin-bottom: 15px;
}

.upload-text {
  font-size: 18px;
  color: #333;
  margin-bottom: 10px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.video-preview {
  position: relative;
}

.video-player {
  width: 100%;
  height: 200px;
}

.video-info {
  padding: 10px 15px;
  background: #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.video-name {
  font-size: 14px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-size {
  font-size: 12px;
  color: #666;
  margin-left: 10px;
}

.progress-section {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 12px;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007AFF, #00c6ff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-percent {
  font-size: 16px;
  font-weight: bold;
  color: #007AFF;
}

.progress-speed {
  font-size: 12px;
  color: #666;
}

.progress-actions {
  display: flex;
  gap: 10px;
}

.btn-pause,
.btn-resume {
  flex: 1;
  height: 36px;
  font-size: 14px;
  border-radius: 18px;
  border: none;
}

.btn-pause {
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
}

.btn-resume {
  background: #007AFF;
  color: #fff;
}

.complete-section,
.error-section {
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  text-align: center;
}

.complete-icon,
.error-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.complete-text {
  font-size: 16px;
  color: #52c41a;
}

.error-text {
  font-size: 14px;
  color: #ff4d4f;
  margin-bottom: 15px;
}

.btn-retry {
  width: 120px;
  height: 36px;
  font-size: 14px;
  background: #007AFF;
  color: #fff;
  border-radius: 18px;
  border: none;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-upload {
  width: 100%;
  height: 50px;
  background: #007AFF;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-radius: 25px;
  border: none;
}

.btn-upload:disabled {
  background: #ccc;
}

.btn-reset {
  width: 100%;
  height: 50px;
  background: #fff;
  color: #666;
  font-size: 16px;
  border-radius: 25px;
  border: 1px solid #ddd;
}
</style>
