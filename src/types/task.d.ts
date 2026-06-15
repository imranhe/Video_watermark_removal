/**
 * 任务相关类型定义
 */

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TaskType = 'subtitle' | 'icon';

export interface Task {
  id: string;
  userId: string;
  videoUrl: string;
  resultUrl: string | null;
  status: TaskStatus;
  taskType: TaskType;
  progress: number;
  errorMessage?: string;
  params: Record<string, any>;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateTaskParams {
  videoUrl: string;
  taskType: TaskType;
  params?: Record<string, any>;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}
