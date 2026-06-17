<template>
  <view class="page">
    <view class="success-section">
      <view class="success-circle">
        <text class="success-char">✓</text>
      </view>
      <text class="success-title">处理完成</text>
    </view>

    <!-- Before/After comparison -->
    <view class="compare-card" v-if="resultUrl">
      <view class="compare-tabs">
        <view class="compare-tab" :class="{ active: viewMode === 'result' }" @tap="viewMode = 'result'">
          <text class="compare-tab-text">处理后</text>
        </view>
        <view class="compare-tab" :class="{ active: viewMode === 'compare' }" @tap="viewMode = 'compare'">
          <text class="compare-tab-text">对比</text>
        </view>
      </view>
      <view class="video-wrap">
        <video :src="resultUrl" class="video-player" controls v-if="viewMode === 'result'"></video>
        <view class="compare-split" v-else>
          <view class="compare-half">
            <text class="compare-label">原视频</text>
            <video :src="originalUrl" class="video-half" controls></video>
          </view>
          <view class="compare-half">
            <text class="compare-label">处理后</text>
            <video :src="resultUrl" class="video-half" controls></video>
          </view>
        </view>
      </view>
    </view>

    <!-- Task info (via TaskStatus component) -->
    <TaskStatus
      v-if="currentTask"
      compact
      :task-id="currentTask.id"
      :status="currentTask.status"
      :task-type="currentTask.taskType"
      :progress="currentTask.progress"
      :created-at="currentTask.createdAt"
      :completed-at="currentTask.completedAt"
      :error-message="currentTask.errorMessage"
      :result-url="currentTask.resultUrl"
      @download="downloadResult"
    />

    <!-- Actions -->
    <view class="actions">
      <button class="btn-primary" @tap="downloadResult">保存到相册</button>
      <button class="btn-share" @tap="shareResult">分享给好友</button>
      <button class="btn-outline" @tap="goHome">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTaskStore } from '@/store/task';
import { onShareAppMessage } from '@dcloudio/uni-app';
import TaskStatus from '@/components/TaskStatus.vue';

// #ifdef MP-WEIXIN
onShareAppMessage(() => ({
  title: '视频去字幕 - AI智能去除视频水印',
  path: '/pages/index/index',
}));
// #endif

const taskStore = useTaskStore();
const currentTask = computed(() => taskStore.currentTask);
const resultUrl = computed(() => currentTask.value?.resultUrl || '');
const originalUrl = computed(() => currentTask.value?.videoUrl || '');
const viewMode = ref<'result' | 'compare'>('result');

onLoad((options) => {
  if (options?.taskId) {
    taskStore.fetchTask(options.taskId);
  }
});

function downloadResult() {
  if (!resultUrl.value) return;
  uni.showLoading({ title: '保存中...' });
  uni.authorize({
    scope: 'scope.writePhotosAlbum',
    success: () => {
      uni.saveVideoToPhotosAlbum({
        filePath: resultUrl.value,
        success: () => {
          uni.hideLoading();
          uni.showToast({ title: '已保存到相册', icon: 'success' });
        },
        fail: () => {
          uni.hideLoading();
          uni.showToast({ title: '保存失败', icon: 'none' });
        },
      });
    },
    fail: () => {
      uni.hideLoading();
      uni.showModal({
        title: '提示',
        content: '需要您授权保存到相册，是否去设置开启？',
        success: (res) => {
          if (res.confirm) {
            uni.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting['scope.writePhotosAlbum']) {
                  downloadResult();
                }
              },
            });
          }
        },
      });
    },
  });
}

function shareResult() {
  // #ifdef MP-WEIXIN
  // 微信小程序通过右上角菜单分享，此处提示用户
  uni.showToast({ title: '请点击右上角分享', icon: 'none' });
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '请使用系统分享功能', icon: 'none' });
  // #endif
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--space-4);
}
.success-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6) 0 var(--space-4);
}
.success-circle {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-3);
}
.success-char {
  font-size: var(--font-size-2xl);
  color: #fff;
  font-weight: var(--font-weight-bold);
}
.success-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

/* Compare */
.compare-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
  margin-bottom: var(--space-4);
}
.compare-tabs {
  display: flex;
  border-bottom: 0.5px solid var(--color-separator);
}
.compare-tab {
  flex: 1;
  text-align: center;
  padding: var(--space-3) 0;
  border-bottom: 2px solid transparent;
}
.compare-tab.active {
  border-bottom-color: var(--color-primary);
}
.compare-tab-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}
.compare-tab.active .compare-tab-text {
  color: var(--color-primary);
}
.video-wrap {
  padding: var(--space-3);
}
.video-player {
  width: 100%;
  height: 220px;
  border-radius: var(--radius-sm);
}
.compare-split {
  display: flex;
  gap: var(--space-2);
}
.compare-half {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.compare-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-align: center;
}
.video-half {
  width: 100%;
  height: 160px;
  border-radius: var(--radius-sm);
}

/* Actions */
.actions {
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
.btn-share {
  width: 100%;
  height: var(--btn-height-lg);
  background: var(--color-success);
  color: #fff;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-outline {
  width: 100%;
  height: var(--btn-height-md);
  background: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
