/**
 * 任务状态管理
 *
 * createTask 使用 uni.uploadFile 直接上传视频文件到后端
 * （后端 POST /v1/tasks 接口期望 multipart file + task_type + region）
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { uploadFile, get } from '@/api/request';
import { useTaskPoller } from '@/utils/poller';
import type { Task, TaskStatus, TaskType } from '@/types';

export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<Task[]>([]);
  const currentTask = ref<Task | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 任务轮询器
  const { isPolling, startPolling, stopPolling } = useTaskPoller({
    interval: 3000,
    useSSE: true,
  });

  // Getters
  const pendingTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'pending')
  );
  const completedTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'completed')
  );
  const taskCount = computed(() => tasks.value.length);

  // Actions
  /**
   * 创建处理任务
   * 后端 POST /v1/tasks 接口使用 multer upload.single('video')
   * 前端必须通过 uni.uploadFile 发送 multipart/form-data
   */
  async function createTask(
    videoFilePath: string,
    taskType: TaskType,
    region?: Record<string, any>
  ): Promise<Task> {
    isLoading.value = true;
    error.value = null;

    try {
      const formData: Record<string, string> = {
        task_type: taskType,
      };
      if (region) {
        formData.region = JSON.stringify(region);
      }

      const result = await uploadFile<Task>(
        '/v1/tasks',
        videoFilePath,
        formData,
        'video'
      );

      const task = result.data;
      currentTask.value = task;
      tasks.value.unshift(task);

      // 开始轮询任务状态
      startPollingTask(task.id);

      return task;
    } catch (err: any) {
      error.value = err.message || '创建任务失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 开始轮询任务状态
   */
  function startPollingTask(taskId: string): void {
    startPolling(
      taskId,
      (taskState) => {
        // 更新任务状态
        const task = tasks.value.find((t) => t.id === taskId);
        if (task) {
          task.status = taskState.status;
          task.progress = taskState.progress;
          task.resultUrl = taskState.resultUrl;
          task.errorMessage = taskState.errorMessage;
          if (taskState.status === 'completed') {
            task.completedAt = new Date().toISOString();
          }
          currentTask.value = task;
        }
      },
      (err) => {
        error.value = err.message;
      }
    );
  }

  /**
   * 停止轮询
   */
  function stopPollingTask(): void {
    stopPolling();
  }

  /**
   * 获取任务详情
   */
  async function fetchTask(taskId: string): Promise<Task | null> {
    try {
      const result = await get<Task>(`/v1/tasks/${taskId}`);
      const task = result.data;

      const index = tasks.value.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = task;
      } else {
        tasks.value.unshift(task);
      }
      currentTask.value = task;

      return task;
    } catch (err: any) {
      error.value = err.message || '获取任务失败';
      return null;
    }
  }

  /**
   * 获取用户任务列表
   */
  async function fetchUserTasks(): Promise<Task[]> {
    try {
      const result = await get<any>('/v1/tasks', { page: 1, page_size: 20 });
      const data = result.data;
      tasks.value = data.list || data.tasks || data || [];
      return tasks.value;
    } catch (err: any) {
      error.value = err.message || '获取任务列表失败';
      return [];
    }
  }

  function setCurrentTask(task: Task | null) {
    currentTask.value = task;
  }

  function clearTasks() {
    stopPolling();
    tasks.value = [];
    currentTask.value = null;
  }

  return {
    // State
    tasks,
    currentTask,
    isLoading,
    error,
    isPolling,
    // Getters
    pendingTasks,
    completedTasks,
    taskCount,
    // Actions
    createTask,
    fetchTask,
    fetchUserTasks,
    startPollingTask,
    stopPollingTask,
    setCurrentTask,
    clearTasks,
  };
});
