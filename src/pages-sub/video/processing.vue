<template>
  <view class="page">
    <view class="progress-card">
      <view class="progress-ring">
        <text class="progress-value">{{ progress }}%</text>
      </view>
      <text class="progress-stage">{{ stageText }}</text>
      <text class="progress-remain" v-if="remainingText">{{ remainingText }}</text>
    </view>

    <view class="bar-card">
      <view class="bar-track">
        <view class="bar-fill" :style="{ width: progress + '%' }"></view>
      </view>
    </view>

    <!-- Stages -->
    <view class="stages-card">
      <view class="stage-row" v-for="(s, idx) in stages" :key="idx">
        <view class="stage-dot" :class="{ done: s.done, active: s.active }">
          <text class="stage-check" v-if="s.done">✓</text>
        </view>
        <text class="stage-text" :class="{ active: s.active }">{{ s.label }}</text>
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
      @retry="retryTask"
    />

    <!-- Error -->
    <view class="error-card" v-if="currentTask?.status === 'failed'">
      <text class="error-text">{{ currentTask.errorMessage || '处理失败，请重试' }}</text>
      <button class="btn-retry" @tap="retryTask">重新处理</button>
    </view>

    <button class="btn-cancel" @tap="cancelTask" v-if="currentTask?.status === 'processing' || currentTask?.status === 'pending'">
      取消任务
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTaskStore } from '@/store/task';
import TaskStatus from '@/components/TaskStatus.vue';

const taskStore = useTaskStore();
const taskId = ref('');
const startTime = ref(Date.now());

const currentTask = computed(() => taskStore.currentTask);
const progress = computed(() => currentTask.value?.progress || 0);

const stageText = computed(() => {
  const p = progress.value;
  if (p < 15) return '正在分析视频...';
  if (p < 40) return '正在识别字幕区域...';
  if (p < 80) return '正在去除字幕...';
  if (p < 100) return '正在渲染输出...';
  return '处理完成！';
});

const remainingText = computed(() => {
  const p = progress.value;
  if (p <= 0 || p >= 100) return '';
  const elapsed = (Date.now() - startTime.value) / 1000;
  const totalEstimate = elapsed / (p / 100);
  const remain = Math.max(0, totalEstimate - elapsed);
  if (remain < 60) return `预计还需 ${Math.ceil(remain)} 秒`;
  return `预计还需 ${Math.ceil(remain / 60)} 分钟`;
});

const stages = computed(() => {
  const p = progress.value;
  return [
    { label: '分析视频', done: p >= 15, active: p > 0 && p < 15 },
    { label: '识别字幕区域', done: p >= 40, active: p >= 15 && p < 40 },
    { label: '去除字幕', done: p >= 80, active: p >= 40 && p < 80 },
    { label: '渲染输出', done: p >= 100, active: p >= 80 && p < 100 },
  ];
});

onLoad((options) => {
  if (options?.taskId) {
    taskId.value = options.taskId;
    startTime.value = Date.now();
    taskStore.fetchTask(options.taskId).then(() => {
      const task = taskStore.currentTask;
      if (task && (task.status === 'pending' || task.status === 'processing')) {
        taskStore.startPollingTask(options.taskId);
      }
      if (task?.status === 'completed') {
        goToResult();
      }
    });
  }
});

const stopWatch = watch(
  () => taskStore.currentTask?.status,
  (status) => {
    if (status === 'completed') goToResult();
  }
);

function goToResult() {
  uni.redirectTo({ url: `/pages-sub/video/result?taskId=${taskId.value}` });
}

async function retryTask() {
  if (!taskId.value) return;
  try {
    startTime.value = Date.now();
    const task = await taskStore.fetchTask(taskId.value);
    if (task) taskStore.startPollingTask(taskId.value);
  } catch {
    uni.showToast({ title: '重试失败', icon: 'none' });
  }
}

function cancelTask() {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消当前任务吗？',
    success: (res) => {
      if (res.confirm) {
        taskStore.stopPollingTask();
        uni.navigateBack();
      }
    },
  });
}

onUnmounted(() => {
  stopWatch();
  taskStore.stopPollingTask();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--space-4);
}
.progress-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-8) var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: var(--shadow-xs);
  margin-bottom: var(--space-4);
}
.progress-ring {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-full);
  border: 4px solid var(--color-primary-light);
  border-top-color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
  animation: spin 1.2s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.progress-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}
.progress-stage {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}
.progress-remain {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Stages */
.stages-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-xs);
  margin-bottom: var(--space-4);
}
.stage-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}
.stage-dot {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-separator);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}
.stage-dot.done {
  background: var(--color-success);
  border-color: var(--color-success);
}
.stage-dot.active {
  border-color: var(--color-primary);
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,122,255,0.3); }
  50% { box-shadow: 0 0 0 6px rgba(0,122,255,0); }
}
.stage-check {
  font-size: 10px;
  color: #fff;
  font-weight: var(--font-weight-bold);
}
.stage-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}
.stage-text.active {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

/* Progress bar */
.bar-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-xs);
  margin-bottom: var(--space-4);
}
.bar-track {
  height: 6px;
  background: var(--color-separator);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

/* Error */
.error-card {
  background: var(--color-error-light);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  text-align: center;
  margin-bottom: var(--space-4);
}
.error-text { font-size: var(--font-size-base); color: var(--color-error); margin-bottom: var(--space-4); }
.btn-retry {
  width: 160px; height: var(--btn-height-md);
  background: var(--color-error); color: #fff;
  font-size: var(--font-size-base); font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md); border: none;
  display: inline-flex; align-items: center; justify-content: center;
}
.btn-cancel {
  width: 100%; height: var(--btn-height-md);
  background: transparent; color: var(--color-text-secondary);
  font-size: var(--font-size-base); font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md); border: 1px solid var(--color-separator);
  display: flex; align-items: center; justify-content: center;
}
</style>
