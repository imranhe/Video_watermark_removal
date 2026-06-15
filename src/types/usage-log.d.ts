/**
 * 使用记录相关类型定义
 */

export interface UsageLog {
  id: string;
  userId: string;
  taskId: string;
  creditUsed: number;
  createdAt: string;
}

export interface UsageLogListResponse {
  logs: UsageLog[];
  total: number;
}
