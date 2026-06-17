/**
 * 类型安全的网络请求工具
 * 封装 uni.request，支持泛型类型推导、JWT Token、错误处理、日志记录
 */

import { logApiError, logWarn } from '@/utils/logger';

// API 基础地址（开发环境用 localhost，上线前改为真实域名）
export const API_BASE: string =
  import.meta.env.VITE_API_BASE || 'http://localhost:3000';

interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
}

interface RequestResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

interface RequestError {
  code: number;
  message: string;
}

// Token 存储键名
const TOKEN_KEY = 'access_token';

/**
 * 获取存储的 Token
 */
export function getToken(): string | null {
  return uni.getStorageSync(TOKEN_KEY) || null;
}

/**
 * 存储 Token
 */
export function setToken(token: string): void {
  uni.setStorageSync(TOKEN_KEY, token);
}

/**
 * 清除 Token
 */
export function clearToken(): void {
  uni.removeStorageSync(TOKEN_KEY);
}

/**
 * 基础请求函数
 */
function baseRequest<T>(
  config: RequestConfig
): Promise<RequestResponse<T>> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.header,
    };

    // 添加 JWT Token
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    uni.request({
      url: config.url.startsWith('http') ? config.url : `${API_BASE}${config.url}`,
      method: config.method || 'GET',
      data: config.data,
      header,
      timeout: config.timeout || 30000,
      success: (response) => {
        const { statusCode, data } = response as any;

        // HTTP 状态码处理
        if (statusCode === 401) {
          logWarn('API 401 未授权', { url: config.url });
          clearToken();
          uni.navigateTo({ url: '/pages/login/login' });
          reject({ code: 401, message: '登录已过期，请重新登录' });
          return;
        }

        if (statusCode >= 200 && statusCode < 300) {
          resolve(data as RequestResponse<T>);
        } else {
          logApiError(config.url, config.method || 'GET', statusCode, data?.message || '请求失败', config.data);
          reject({
            code: statusCode,
            message: data?.message || '请求失败',
          });
        }
      },
      fail: (error) => {
        logApiError(config.url, config.method || 'GET', -1, error.errMsg || '网络连接失败', config.data);
        reject({
          code: -1,
          message: error.errMsg || '网络连接失败',
        });
      },
    });
  });
}

/**
 * 类型安全的 GET 请求
 */
export function get<T>(url: string, data?: any): Promise<RequestResponse<T>> {
  return baseRequest<T>({ url, method: 'GET', data });
}

/**
 * 类型安全的 POST 请求
 */
export function post<T>(url: string, data?: any): Promise<RequestResponse<T>> {
  return baseRequest<T>({ url, method: 'POST', data });
}

/**
 * 类型安全的 PUT 请求
 */
export function put<T>(url: string, data?: any): Promise<RequestResponse<T>> {
  return baseRequest<T>({ url, method: 'PUT', data });
}

/**
 * 类型安全的 DELETE 请求
 */
export function del<T>(url: string, data?: any): Promise<RequestResponse<T>> {
  return baseRequest<T>({ url, method: 'DELETE', data });
}

/**
 * 文件上传（小程序端不支持 multipart JSON 请求，使用 uni.uploadFile）
 */
export function uploadFile<T = any>(
  url: string,
  filePath: string,
  formData: Record<string, string> = {},
  name = 'video'
): Promise<RequestResponse<T>> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const header: Record<string, string> = {};
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

    uni.uploadFile({
      url: fullUrl,
      filePath,
      name,
      formData,
      header,
      timeout: 120000,
      success: (response) => {
        if (response.statusCode === 401) {
          logWarn('上传 401 未授权', { url });
          clearToken();
          uni.navigateTo({ url: '/pages/login/login' });
          reject({ code: 401, message: '登录已过期，请重新登录' });
          return;
        }
        // uploadFile 返回的 data 是字符串，需要 JSON.parse
        let parsed: any;
        try {
          parsed = JSON.parse(response.data as string);
        } catch {
          logApiError(url, 'UPLOAD', -1, '响应解析失败', { raw: String(response.data).slice(0, 200) });
          reject({ code: -1, message: '响应解析失败' });
          return;
        }
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(parsed as RequestResponse<T>);
        } else {
          logApiError(url, 'UPLOAD', response.statusCode, parsed?.message || '上传失败');
          reject({
            code: response.statusCode,
            message: parsed?.message || '上传失败',
          });
        }
      },
      fail: (error) => {
        logApiError(url, 'UPLOAD', -1, error.errMsg || '上传失败');
        reject({ code: -1, message: error.errMsg || '上传失败' });
      },
    });
  });
}

export default {
  get,
  post,
  put,
  del,
  getToken,
  setToken,
  clearToken,
  uploadFile,
  API_BASE,
};
