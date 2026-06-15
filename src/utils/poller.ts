/**
 * 任务轮询工具
 * 支持SSE实时推送，降级为轮询机制
 */

import { ref, onUnmounted } from 'vue';

type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface TaskState {
  id: string;
  status: TaskStatus;
  progress: number;
  resultUrl?: string;
  errorMessage?: string;
  updatedAt: string;
}

type StatusCallback = (task: TaskState) => void;
type ErrorCallback = (error: Error) => void;

interface PollingConfig {
  interval?: number;    // 轮询间隔（毫秒），默认 5000
  maxRetries?: number;  // 最大重试次数，默认 5
  useSSE?: boolean;     // 是否使用 SSE，默认 true
}

export function useTaskPoller(config: PollingConfig = {}) {
  const {
    interval = 5000,
    maxRetries = 5,
    useSSE = true,
  } = config;

  // 状态
  const isPolling = ref(false);
  const currentTaskId = ref<string | null>(null);
  const error = ref<string | null>(null);

  // 定时器和连接
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let eventSource: EventSource | null = null;
  let retryCount = 0;

  /**
   * 开始轮询任务状态
   */
  function startPolling(
    taskId: string,
    onStatusChange: StatusCallback,
    onError?: ErrorCallback
  ): void {
    stopPolling();

    currentTaskId.value = taskId;
    isPolling.value = true;
    error.value = null;
    retryCount = 0;

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

    // #ifdef H5
    if (useSSE && typeof EventSource !== 'undefined') {
      startSSE(taskId, API_BASE, onStatusChange, onError);
    } else {
      startPollingLoop(taskId, API_BASE, onStatusChange, onError);
    }
    // #endif

    // #ifndef H5
    startPollingLoop(taskId, API_BASE, onStatusChange, onError);
    // #endif
  }

  /**
   * 使用 SSE 实时推送
   */
  function startSSE(
    taskId: string,
    apiBase: string,
    onStatusChange: StatusCallback,
    onError?: ErrorCallback
  ): void {
    try {
      eventSource = new EventSource(`${apiBase}/api/tasks/${taskId}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const task: TaskState = JSON.parse(event.data);
          onStatusChange(task);

          // 任务完成或失败时停止轮询
          if (task.status === 'completed' || task.status === 'failed') {
            stopPolling();
          }
        } catch (err) {
          console.error('解析任务状态失败:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE 连接错误:', err);

        // SSE 失败时降级为轮询
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        console.log('降级为轮询模式');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
        startPollingLoop(taskId, API_BASE, onStatusChange, onError);
      };
    } catch (err) {
      // SSE 不支持时降级为轮询
      console.warn('SSE 不支持，降级为轮询模式');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      startPollingLoop(taskId, API_BASE, onStatusChange, onError);
    }
  }

  /**
   * 使用轮询机制
   */
  function startPollingLoop(
    taskId: string,
    apiBase: string,
    onStatusChange: StatusCallback,
    onError?: ErrorCallback
  ): void {
    const poll = async () => {
      try {
        // #ifdef H5
        uni.request({
          url: `${apiBase}/api/tasks/${taskId}`,
          method: 'GET',
          success: (res) => {
            if (res.statusCode === 200) {
              const task = res.data as TaskState;
              retryCount = 0;
              onStatusChange(task);
              if (task.status === 'completed' || task.status === 'failed') {
                stopPolling();
              }
            } else {
              throw new Error(`HTTP ${res.statusCode}`);
            }
          },
          fail: (err) => {
            retryCount++;
            console.error(`轮询失败 (${retryCount}/${maxRetries}):`, err);
            if (retryCount >= maxRetries) {
              error.value = '网络连接失败，请检查网络';
              stopPolling();
              onError?.(new Error('达到最大重试次数'));
            }
          }
        });
        // #endif

        // #ifndef H5
        uni.request({
          url: `${apiBase}/api/tasks/${taskId}`,
          method: 'GET',
          success: (res) => {
            if (res.statusCode === 200) {
              const task = res.data as TaskState;
              retryCount = 0;
              onStatusChange(task);
              if (task.status === 'completed' || task.status === 'failed') {
                stopPolling();
              }
            } else {
              throw new Error(`HTTP ${res.statusCode}`);
            }
          },
          fail: (err) => {
            retryCount++;
            console.error(`轮询失败 (${retryCount}/${maxRetries}):`, err);
            if (retryCount >= maxRetries) {
              error.value = '网络连接失败，请检查网络';
              stopPolling();
              onError?.(new Error('达到最大重试次数'));
            }
          }
        });
        // #endif
      } catch (err: any) {
        retryCount++;
        console.error(`轮询失败 (${retryCount}/${maxRetries}):`, err);

        if (retryCount >= maxRetries) {
          error.value = '网络连接失败，请检查网络';
          stopPolling();
          onError?.(new Error('达到最大重试次数'));
        }
      }
    };

    // 立即执行一次
    poll();

    // 设置定时器
    pollTimer = setInterval(poll, interval);
  }

  /**
   * 停止轮询
   */
  function stopPolling(): void {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    isPolling.value = false;
    currentTaskId.value = null;
  }

  /**
   * 暂停轮询
   */
  function pausePolling(): void {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    isPolling.value = false;
  }

  /**
   * 恢复轮询
   */
  function resumePolling(
    taskId: string,
    onStatusChange: StatusCallback,
    onError?: ErrorCallback
  ): void {
    if (!isPolling.value) {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      startPollingLoop(taskId, API_BASE, onStatusChange, onError);
    }
  }

  // 组件卸载时停止轮询
  onUnmounted(() => {
    stopPolling();
  });

  return {
    isPolling,
    currentTaskId,
    error,
    startPolling,
    stopPolling,
    pausePolling,
    resumePolling,
  };
}
