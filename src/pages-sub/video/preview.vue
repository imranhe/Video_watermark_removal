<template>
  <view class="container">
    <view class="header">
      <view class="task-type-badge">{{ taskType === 'subtitle' ? '去除字幕' : '去除图标' }}</view>
      <view class="title">视频预览</view>
    </view>

    <view class="content">
      <video :src="videoPath" class="video-player" controls></video>

      <view class="info-card" v-if="fileId">
        <view class="info-row">
          <text class="info-label">任务类型</text>
          <text class="info-value">{{ taskType === 'subtitle' ? '去除字幕' : '去除图标' }}</text>
        </view>
        <view class="info-row" v-if="taskType === 'subtitle'">
          <text class="info-label">字幕位置</text>
          <text class="info-value">{{ positionLabel }}</text>
        </view>
      </view>

      <view class="options">
        <button class="btn-primary" @tap="startProcess" :disabled="isProcessing">
          {{ isProcessing ? '提交中...' : '开始处理' }}
        </button>
        <button class="btn-secondary" @tap="goBack">返回重新选择</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTaskStore } from '@/store/task';

const taskStore = useTaskStore();

const videoPath = ref('');
const fileId = ref('');
const taskType = ref<'subtitle' | 'icon'>('subtitle');
const subtitlePosition = ref('bottom');
const isProcessing = ref(false);

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
  isProcessing.value = true;
  try {
    const task = await taskStore.createTask(videoPath.value, taskType.value, {
      fileId: fileId.value,
      subtitlePosition: subtitlePosition.value,
    });
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
.container {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  text-align: center;
  margin-bottom: 20px;
}
.task-type-badge {
  display: inline-block;
  padding: 6px 16px;
  background: #007AFF;
  color: #fff;
  font-size: 12px;
  border-radius: 20px;
  margin-bottom: 10px;
}
.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.content {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.video-player {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}
.info-card {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}
.info-label {
  font-size: 14px;
  color: #666;
}
.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.options {
  margin-top: 20px;
}
.btn-primary {
  width: 100%;
  height: 50px;
  background: #007AFF;
  color: #fff;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
}
.btn-secondary {
  width: 100%;
  height: 44px;
  background: #f5f5f5;
  color: #666;
  border-radius: 22px;
  font-size: 14px;
}
</style>
