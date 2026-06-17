/**
 * Consolidated Type Definitions
 *
 * Single source of truth for all TypeScript types.
 * Import from '@/types' instead of defining locally.
 */

// ===========================================
// API Types
// ===========================================

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export interface ApiError {
  code: number;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestConfig {
  url: string;
  method: HttpMethod;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

// ===========================================
// User Types
// ===========================================

export interface UserInfo {
  id: string;
  openid?: string;
  nickname: string;
  avatarUrl: string;
  phone?: string;
  balance: number;
  vipType: 'none' | 'monthly' | 'quarterly' | 'yearly';
  vipExpireAt: string | null;
  totalTasks: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginParams {
  code: string;
  platform: 'wechat' | 'alipay' | 'h5';
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userInfo: UserInfo;
}

// ===========================================
// Task Types
// ===========================================

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type TaskType = 'subtitle' | 'watermark' | 'logo' | 'icon';

export interface Task {
  id: string;
  userId: string;
  videoUrl: string;
  resultUrl: string | null;
  status: TaskStatus;
  taskType: TaskType;
  params: Record<string, any> | null;
  progress: number;
  pointsCost: number;
  retryCount: number;
  priority: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deletedAt: string | null;
}

export interface CreateTaskParams {
  videoFile: File | string;
  taskType: TaskType;
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TaskListResponse {
  list: Task[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ===========================================
// Order Types
// ===========================================

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export type PaymentPlatform = 'wechat' | 'alipay';

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  packageId: string;
  packageName: string;
  amount: number;
  credits: number;
  status: OrderStatus;
  paymentMethod: PaymentPlatform;
  paymentParams: Record<string, any> | null;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateOrderParams {
  packageId: string;
  paymentMethod: PaymentPlatform;
}

export interface OrderListResponse {
  list: Order[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ===========================================
// Package Types
// ===========================================

export type PackageType = 'points' | 'monthly' | 'quarterly' | 'yearly';

export interface Package {
  id: string;
  name: string;
  type: PackageType;
  price: number;
  credits: number;
  durationDays: number | null;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ===========================================
// Points Types
// ===========================================

export type PointsLogType = 'consume' | 'recharge' | 'gift' | 'refund';

export interface PointsLog {
  id: string;
  userId: string;
  type: PointsLogType;
  amount: number;
  balance: number;
  description: string;
  taskId: string | null;
  orderId: string | null;
  createdAt: string;
}

// ===========================================
// Notification Types
// ===========================================

export type NotificationType = 'task_complete' | 'payment_success' | 'system' | 'promotion';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

// ===========================================
// Feedback Types
// ===========================================

export type FeedbackType = 'bug' | 'feature' | 'complaint' | 'other';
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export interface Feedback {
  id: string;
  userId: string;
  type: FeedbackType;
  title: string;
  content: string;
  images: string[] | null;
  status: FeedbackStatus;
  reply: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===========================================
// System Types
// ===========================================

export interface SystemConfig {
  [key: string]: string | number | boolean;
}

export interface ProcessingConfig {
  subtitle: {
    pointsCost: number;
    maxDuration: number;
    maxSize: number;
  };
  watermark: {
    pointsCost: number;
    maxDuration: number;
    maxSize: number;
  };
  logo: {
    pointsCost: number;
    maxDuration: number;
    maxSize: number;
  };
}

// ===========================================
// Platform Types
// ===========================================**

export type Platform = 'wechat' | 'alipay' | 'h5' | 'app';

export interface PlatformInfo {
  platform: Platform;
  version: string;
  system: string;
  model: string;
}

// ===========================================
// Upload Types
// ===========================================

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  remainingTime: number;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

// ===========================================
// Poller Types (Task Status Polling)
// ===========================================

export interface TaskPollerState {
  status: TaskStatus;
  progress: number;
  resultUrl: string | null;
  errorMessage: string | null;
  estimatedTime: number | null;
}

// ===========================================
// Form Types
// ===========================================

export interface FormField {
  value: any;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface FormState {
  fields: { [key: string]: FormField };
  isValid: boolean;
  isSubmitting: boolean;
}

// ===========================================
// Event Types
// ===========================================

export interface AppEvent {
  type: string;
  payload: any;
  timestamp: number;
}

export interface TaskEvent extends AppEvent {
  type: 'task:created' | 'task:updated' | 'task:completed' | 'task:failed';
  payload: {
    taskId: string;
    status: TaskStatus;
    progress: number;
  };
}

// ===========================================
// Utility Types
// ===========================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Nullable<T> = T | null;

export type AsyncFunction<T = void> = (...args: any[]) => Promise<T>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
