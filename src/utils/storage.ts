/**
 * 存储工具函数
 */

const STORAGE_PREFIX = 'video_remover_';

/**
 * 获取存储项
 */
export function getItem<T>(key: string): T | null {
  try {
    const value = uni.getStorageSync(`${STORAGE_PREFIX}${key}`);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/**
 * 设置存储项
 */
export function setItem<T>(key: string, value: T): void {
  try {
    uni.setStorageSync(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.error('存储失败:', error);
  }
}

/**
 * 删除存储项
 */
export function removeItem(key: string): void {
  try {
    uni.removeStorageSync(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error('删除存储项失败:', error);
  }
}

/**
 * 清除所有存储
 */
export function clear(): void {
  try {
    uni.clearStorageSync();
  } catch (error) {
    console.error('清除存储失败:', error);
  }
}

export default {
  getItem,
  setItem,
  removeItem,
  clear,
};
