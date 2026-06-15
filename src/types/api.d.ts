/**
 * API 通用类型定义
 */

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export interface ApiError {
  code: number;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// HTTP 方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// 请求配置
export interface RequestConfig {
  url: string;
  method?: HttpMethod;
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
}
