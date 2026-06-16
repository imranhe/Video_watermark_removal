/**
 * 任务状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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
  async function createTask(
    videoUrl: string,
    taskType: 'subtitle' | 'icon',
    params: Record<string, any> = {}
  ): Promise<Task> {
    isLoading.value = true;
    error.value = null;

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const response = await uni.request({
        url: `${API_BASE}/v1/tasks/create`,
        method: 'POST',
        data: { videoUrl, taskType, params },
      });

      if (response.statusCode !== 200) {
        throw new Error('创建任务失败');
      }

      const task = response.data as Task;
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
          task.resultUrl = taskState.resultUrl || null;
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
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const response = await uni.request({
        url: `${API_BASE}/v1/tasks/${taskId}`,
        method: 'GET',
      });

      if (response.statusCode !== 200) {
        throw new Error('获取任务失败');
      }

      const task = response.data as Task;
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
  async function fetchUserTasks(userId: string): Promise<Task[]> {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const response = await uni.request({
        url: `${API_BASE}/v1/tasks/user/${userId}`,
        method: 'GET',
      });

      if (response.statusCode !== 200) {
        throw new Error('获取任务列表失败');
      }

      tasks.value = response.data as Task[];
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
