/**
 * 类型安全的网络请求工具
 * 封装 uni.request，支持泛型类型推导、JWT Token、错误处理
 */

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
      url: config.url,
      method: config.method || 'GET',
      data: config.data,
      header,
      timeout: config.timeout || 30000,
      success: (response) => {
        const { statusCode, data } = response as any;

        // HTTP 状态码处理
        if (statusCode === 401) {
          clearToken();
          uni.navigateTo({ url: '/pages/login/login' });
          reject({ code: 401, message: '登录已过期，请重新登录' });
          return;
        }

        if (statusCode >= 200 && statusCode < 300) {
          resolve(data as RequestResponse<T>);
        } else {
          reject({
            code: statusCode,
            message: data?.message || '请求失败',
          });
        }
      },
      fail: (error) => {
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

export default {
  get,
  post,
  put,
  del,
  getToken,
  setToken,
  clearToken,
};
