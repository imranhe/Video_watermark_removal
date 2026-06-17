<template>
  <view class="page">
    <!-- Navigation Header: white background -->
    <view class="nav-header">
      <view class="nav-left" @tap="goBack">
        <view class="nav-back-arrow"></view>
      </view>
      <text class="nav-title">历史记录</text>
      <view class="nav-right" @tap="clearAll" v-if="tasks.length > 0">
        <text class="nav-clear-text">清空</text>
      </view>
      <view class="nav-right" v-else>
        <text class="nav-clear-text nav-clear-hidden">清空</text>
      </view>
    </view>

    <!-- Task Card List -->
    <scroll-view
      class="task-scroll"
      scroll-y
      :style="{ height: scrollHeight }"
      v-if="tasks.length > 0"
    >
      <view class="task-list">
        <view
          class="task-card"
          v-for="task in tasks"
          :key="task.id"
        >
          <view class="task-card__row">
            <!-- Thumbnail (56x56) -->
            <view
              class="task-card__thumb"
              @tap="viewTask(task)"
            >
              <view class="task-card__thumb-inner">
                <!-- Video play icon overlay -->
                <view class="task-card__thumb-overlay" v-if="task.taskType !== 'logo'">
                  <text class="task-card__thumb-play-icon">&#x25B6;</text>
                </view>
              </view>
            </view>

            <!-- Info: filename + date + status -->
            <view class="task-card__info">
              <text class="task-card__filename">{{ truncateFileName(task.taskType) }}</text>
              <text class="task-card__date">{{ formatTime(task.createdAt, true) }}</text>
              <view class="task-card__status-tag" :class="`task-card__status-tag--${task.status}`">
                <text class="task-card__status-text">{{ statusLabel(task.status) }}</text>
              </view>
            </view>

            <!-- Right action button: single capsule -->
            <view class="task-card__action">
              <view
                v-if="task.status === 'completed'"
                class="task-card__btn task-card__btn--download"
                @tap.stop="viewTask(task)"
              >
                <text class="task-card__btn-text task-card__btn-text--download">下载</text>
              </view>
              <view
                v-else
                class="task-card__btn task-card__btn--view"
                @tap.stop="viewTask(task)"
              >
                <text class="task-card__btn-text task-card__btn-text--view">查看</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- Empty State -->
    <view class="empty-state" v-else>
      <view class="empty-state__icon-wrap">
        <text class="empty-state__icon-char">空</text>
      </view>
      <text class="empty-state__title">暂无处理记录</text>
      <text class="empty-state__desc">返回主页上传文件，秒级擦除水印</text>
    </view>

    <!-- Lightbox Preview -->
    <view class="lightbox" v-if="previewVisible" @tap="closePreview">
      <view class="lightbox__mask" />
      <view class="lightbox__card" @tap.stop>
        <!-- Card header: filename + date -->
        <view class="lightbox__header">
          <text class="lightbox__header-name">{{ currentPreviewName }}</text>
          <text class="lightbox__header-date">{{ currentPreviewDate }}</text>
        </view>

        <!-- Media preview -->
        <view class="lightbox__media-wrap">
          <video
            v-if="previewType === 'video' && previewUrl"
            :src="previewUrl"
            class="lightbox__media"
            :controls="true"
            :autoplay="true"
            object-fit="contain"
          />
          <image
            v-if="previewType === 'image' && previewUrl"
            :src="previewUrl"
            class="lightbox__media"
            mode="aspectFit"
            @tap.stop
          />
        </view>

        <!-- Bottom buttons: delete + save -->
        <view class="lightbox__footer">
          <view class="lightbox__btn lightbox__btn--delete" @tap.stop="deleteCurrentTask">
            <text class="lightbox__btn-text lightbox__btn-text--delete">删除记录</text>
          </view>
          <view class="lightbox__btn lightbox__btn--save" @tap.stop="downloadResult">
            <text class="lightbox__btn-text lightbox__btn-text--save">立即保存到本地</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useTaskStore } from '@/store/task';
import { del } from '@/api/request';
import { formatTime } from '@/utils/format';
import type { Task, TaskType, TaskStatus } from '@/types';

const taskStore = useTaskStore();
const tasks = computed(() => taskStore.tasks);
const isLoading = computed(() => taskStore.isLoading);

// Scroll height for scroll-view (nav-header only, no filter tabs)
const scrollHeight = ref('calc(100vh - 44px)');

// Lightbox state
const previewVisible = ref(false);
const previewUrl = ref('');
const previewType = ref<'video' | 'image'>('video');
const currentPreviewTask = ref<Task | null>(null);
const currentPreviewName = ref('');
const currentPreviewDate = ref('');

onShow(() => {
  loadTasks();
  uni.getSystemInfo({
    success: (res) => {
      // 44px = nav-header only
      scrollHeight.value = `${res.windowHeight - 44}px`;
    },
  });
});

async function loadTasks() {
  try {
    await taskStore.fetchUserTasks();
  } catch {
    /* ignore */
  }
}

function viewTask(task: Task) {
  if (task.status === 'completed' && task.resultUrl) {
    // Open lightbox preview for completed tasks with result
    previewUrl.value = task.resultUrl;
    previewType.value = task.resultUrl.endsWith('.png') || task.resultUrl.endsWith('.jpg') ? 'image' : 'video';
    currentPreviewTask.value = task;
    currentPreviewName.value = truncateFileName(task.taskType);
    currentPreviewDate.value = formatTime(task.createdAt, true);
    previewVisible.value = true;
  } else if (task.status === 'processing' || task.status === 'pending') {
    uni.navigateTo({ url: `/pages-sub/video/processing?taskId=${task.id}` });
  } else if (task.status === 'completed') {
    uni.navigateTo({ url: `/pages-sub/video/result?taskId=${task.id}` });
  }
}

function closePreview() {
  previewVisible.value = false;
  previewUrl.value = '';
  currentPreviewTask.value = null;
}

function downloadResult() {
  if (!previewUrl.value) return;
  uni.downloadFile({
    url: previewUrl.value,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveVideoToPhotos({
          filePath: res.tempFilePath,
          success: () => {
            uni.showToast({ title: '已保存到相册', icon: 'success' });
          },
          fail: () => {
            // Fallback: try saving as image
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                uni.showToast({ title: '已保存到相册', icon: 'success' });
              },
              fail: () => {
                uni.showToast({ title: '保存失败', icon: 'none' });
              },
            });
          },
        });
      }
    },
    fail: () => {
      uni.showToast({ title: '下载失败', icon: 'none' });
    },
  });
}

function deleteCurrentTask() {
  if (!currentPreviewTask.value) return;
  uni.showModal({
    title: '删除记录',
    content: '确定要删除这条处理记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await del(`/v1/tasks/${currentPreviewTask.value!.id}`);
          taskStore.fetchUserTasks();
          uni.showToast({ title: '已删除', icon: 'success' });
          closePreview();
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    },
  });
}

function clearAll() {
  uni.showModal({
    title: '清空记录',
    content: '确定要清空所有历史记录吗？此操作不可恢复。',
    success: async (res) => {
      if (res.confirm) {
        try {
          for (const task of tasks.value) {
            await del(`/v1/tasks/${task.id}`);
          }
          taskStore.clearTasks();
          uni.showToast({ title: '已清空', icon: 'success' });
        } catch {
          uni.showToast({ title: '清空失败', icon: 'none' });
        }
      }
    },
  });
}

function goBack() {
  uni.navigateBack({ delta: 1 });
}

function truncateFileName(taskType: TaskType): string {
  const labels: Record<string, string> = {
    subtitle: '去除字幕',
    watermark: '去除水印',
    logo: '去除图标',
  };
  return labels[taskType] || '视频处理';
}

function statusLabel(status: TaskStatus): string {
  const labels: Record<string, string> = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  };
  return labels[status] || status;
}
</script>

<style scoped>
/* ===========================================
 * PAGE ROOT
 * =========================================== */
.page {
  min-height: 100vh;
  background: #F3F4F6;
  position: relative;
}

/* ===========================================
 * NAV HEADER - White background
 * =========================================== */
.nav-header {
  background: #FFFFFF;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 44px;
  border-bottom: 0.5px solid #E5E5EA;
}
.nav-left {
  width: 60px;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.nav-back-arrow {
  width: 10px;
  height: 10px;
  border-left: 2px solid #3C3C43;
  border-bottom: 2px solid #3C3C43;
  transform: rotate(45deg);
  margin-left: 4px;
}
.nav-clear-text {
  font-size: 14px;
  color: #FF3B30;
}
.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
  flex: 1;
  text-align: center;
}
.nav-right {
  width: 60px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
}
.nav-clear-hidden {
  color: transparent;
}

/* ===========================================
 * SCROLLABLE TASK LIST
 * =========================================== */
.task-scroll {
  width: 100%;
}
.task-list {
  padding: 12px 16px;
}

/* ===========================================
 * TASK CARD - Simplified 3-part layout
 * =========================================== */
.task-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 0.5px solid rgba(229, 229, 234, 0.6);
}
.task-card__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

/* --- Thumbnail (56x56) --- */
.task-card__thumb {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #1C1C1E;
  position: relative;
}
.task-card__thumb-inner {
  width: 100%;
  height: 100%;
  position: relative;
}
.task-card__thumb-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.task-card__thumb-play-icon {
  font-size: 18px;
  color: #FFFFFF;
  opacity: 0.9;
}

/* --- Info (middle) --- */
.task-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.task-card__filename {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-card__date {
  font-size: 12px;
  color: #8E8E93;
  font-family: monospace;
}
.task-card__status-tag {
  display: inline-flex;
  align-items: center;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 100px;
  align-self: flex-start;
}
.task-card__status-tag--pending {
  background: #FFF3E0;
}
.task-card__status-tag--processing {
  background: #E3F2FD;
}
.task-card__status-tag--completed {
  background: #E8F5E9;
}
.task-card__status-tag--failed {
  background: #FFEBEE;
}
.task-card__status-tag--cancelled {
  background: #F5F5F5;
}
.task-card__status-text {
  font-size: 11px;
  font-weight: 600;
}
.task-card__status-tag--pending .task-card__status-text { color: #E65100; }
.task-card__status-tag--processing .task-card__status-text { color: #1565C0; }
.task-card__status-tag--completed .task-card__status-text { color: #2E7D32; }
.task-card__status-tag--failed .task-card__status-text { color: #C62828; }
.task-card__status-tag--cancelled .task-card__status-text { color: #757575; }

/* --- Right action: single capsule button --- */
.task-card__action {
  flex-shrink: 0;
}
.task-card__btn {
  padding: 6px 20px;
  border-radius: 100px;
}
.task-card__btn--download {
  background: #4B8AF4;
}
.task-card__btn--view {
  background: #1B72E8;
}
.task-card__btn-text {
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
}

/* ===========================================
 * EMPTY STATE
 * =========================================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px 32px;
}
.empty-state__icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 0.5px solid #E5E5EA;
}
.empty-state__icon-char {
  font-size: 24px;
}
.empty-state__title {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 4px;
}
.empty-state__desc {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 4px;
}

/* ===========================================
 * LIGHTBOX PREVIEW
 * =========================================== */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox__mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.lightbox__card {
  position: relative;
  z-index: 1;
  width: 90vw;
  max-width: 360px;
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* --- Lightbox Header --- */
.lightbox__header {
  padding: 12px;
  background: #FAFAFA;
  border-bottom: 0.5px solid #E5E5EA;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.lightbox__header-name {
  font-size: 12px;
  font-weight: 700;
  color: #3C3C43;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}
.lightbox__header-date {
  font-size: 10px;
  color: #8E8E93;
  font-family: monospace;
  flex-shrink: 0;
}

/* --- Lightbox Media --- */
.lightbox__media-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox__media {
  width: 100%;
  height: 100%;
}

/* --- Lightbox Footer --- */
.lightbox__footer {
  padding: 16px;
  background: #FFFFFF;
  border-top: 0.5px solid #E5E5EA;
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}
.lightbox__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
.lightbox__btn--delete {
  padding: 10px 16px;
}
.lightbox__btn--save {
  flex: 1;
  padding: 10px 16px;
  background: #1B72E8;
  box-shadow: 0 2px 4px rgba(27, 114, 232, 0.3);
}
.lightbox__btn-text {
  font-size: 12px;
  font-weight: 600;
}
.lightbox__btn-text--delete {
  color: #FF3B30;
}
.lightbox__btn-text--save {
  color: #FFFFFF;
}
</style>
