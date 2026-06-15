/**
 * 任务相关 API 接口
 */

import { get, post, put } from './request';

// 任务类型定义
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TaskType = 'subtitle' | 'icon';

export interface Task {
  id: string;
  userId: string;
  videoUrl: string;
  resultUrl: string | null;
  status: TaskStatus;
  taskType: TaskType;
  params: Record<string, any>;
  progress: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage?: string;
}

export interface CreateTaskParams {
  videoUrl: string;
  taskType: TaskType;
  params?: Record<string, any>;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 创建处理任务
 */
export async function createTask(params: CreateTaskParams): Promise<Task> {
  const response = await post<Task>('/api/tasks/create', params);
  return response.data;
}

/**
 * 获取任务详情
 */
export async function getTask(taskId: string): Promise<Task> {
  const response = await get<Task>(`/api/tasks/${taskId}`);
  return response.data;
}

/**
 * 获取用户任务列表
 */
export async function getUserTasks(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<TaskListResponse> {
  const response = await get<TaskListResponse>(`/api/tasks/user/${userId}`, {
    page,
    pageSize,
  });
  return response.data;
}

/**
 * 取消任务
 */
export async function cancelTask(taskId: string): Promise<void> {
  await put(`/api/tasks/${taskId}/cancel`);
}

/**
 * 重试任务
 */
export async function retryTask(taskId: string): Promise<Task> {
  const response = await post<Task>(`/api/tasks/${taskId}/retry`);
  return response.data;
}

/**
 * 删除任务
 */
export async function deleteTask(taskId: string): Promise<void> {
  await post(`/api/tasks/${taskId}/delete`);
}
