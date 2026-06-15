<template>
  <view class="container">
    <view class="upload-header">
      <view class="task-type-badge">{{ taskType === 'subtitle' ? '去除字幕' : '去除图标' }}</view>
      <view class="upload-title">上传视频</view>
      <view class="upload-subtitle">选择需要处理的视频文件</view>
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

    <!-- 处理选项 -->
    <view v-if="selectedVideo" class="options-section">
      <view class="option-title">处理选项</view>

      <view class="option-item" v-if="taskType === 'subtitle'">
        <text class="option-label">字幕位置</text>
        <view class="option-buttons">
          <button
            class="option-btn"
            :class="{ active: subtitlePosition === 'bottom' }"
            @tap="subtitlePosition = 'bottom'"
          >
            底部
          </button>
          <button
            class="option-btn"
            :class="{ active: subtitlePosition === 'top' }"
            @tap="subtitlePosition = 'top'"
          >
            顶部
          </button>
          <button
            class="option-btn"
            :class="{ active: subtitlePosition === 'custom' }"
            @tap="subtitlePosition = 'custom'"
          >
            自定义
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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

// 视频选择回调
function handleVideoSelect(video: any) {
  selectedVideo.value = video;
}

// 上传开始回调
function handleUploadStart() {
  isUploading.value = true;
}

// 上传进度回调
function handleUploadProgress(progress: any) {
  console.log('上传进度:', progress.percent);
}

// 上传成功回调
function handleUploadSuccess(result: any) {
  isUploading.value = false;

  // 跳转到预览页面
  uni.navigateTo({
    url: `/pages-sub/video/preview?fileId=${result.fileId}&type=${taskType.value}&position=${subtitlePosition.value}`,
  });
}

// 上传失败回调
function handleUploadError(error: string) {
  isUploading.value = false;
  uni.showToast({
    title: error,
    icon: 'none',
  });
}
</script>

<style scoped>
.container {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

.upload-header {
  text-align: center;
  margin-bottom: 30px;
}

.task-type-badge {
  display: inline-block;
  padding: 6px 16px;
  background: #007AFF;
  color: #fff;
  font-size: 12px;
  border-radius: 20px;
  margin-bottom: 15px;
}

.upload-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.upload-subtitle {
  font-size: 14px;
  color: #666;
}

.options-section {
  margin-top: 30px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.option-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.option-item {
  margin-bottom: 20px;
}

.option-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.option-buttons {
  display: flex;
  gap: 10px;
}

.option-btn {
  flex: 1;
  height: 40px;
  font-size: 14px;
  background: #f5f5f5;
  color: #666;
  border-radius: 8px;
  border: 2px solid transparent;
}

.option-btn.active {
  background: #e6f2ff;
  color: #007AFF;
  border-color: #007AFF;
}
</style>
