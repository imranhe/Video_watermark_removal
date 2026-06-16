/**
 * Shared Utility Functions
 *
 * Centralized utility functions to eliminate code duplication.
 * Import from '@/utils/format' instead of implementing locally.
 */

/**
 * Format ISO date string to human-readable format
 *
 * @param iso - ISO 8601 date string
 * @param includeTime - Whether to include time (default: true)
 * @returns Formatted date string
 *
 * @example
 * formatTime('2024-01-15T10:30:00Z') // '2024-01-15 10:30:00'
 * formatTime('2024-01-15T10:30:00Z', false) // '2024-01-15'
 */
export function formatTime(iso: string | null | undefined, includeTime = true): string {
  if (!iso) return '-';

  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '-';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (!includeTime) {
      return `${year}-${month}-${day}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('formatTime error:', error);
    return '-';
  }
}

/**
 * Format bytes to human-readable file size
 *
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string
 *
 * @example
 * formatSize(1024) // '1 KB'
 * formatSize(1048576) // '1 MB'
 * formatSize(1073741824) // '1 GB'
 */
export function formatSize(bytes: number | null | undefined, decimals = 2): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B';
  if (bytes < 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);

  return parseFloat((bytes / Math.pow(k, index)).toFixed(dm)) + ' ' + sizes[index];
}

/**
 * Format transfer speed to human-readable format
 *
 * @param bytesPerSecond - Speed in bytes per second
 * @returns Formatted speed string
 *
 * @example
 * formatSpeed(1024) // '1 KB/s'
 * formatSpeed(1048576) // '1 MB/s'
 */
export function formatSpeed(bytesPerSecond: number | null | undefined): string {
  if (!bytesPerSecond || bytesPerSecond <= 0) return '0 B/s';
  return formatSize(bytesPerSecond) + '/s';
}

/**
 * Format seconds to human-readable duration
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 *
 * @example
 * formatDuration(0) // '0秒'
 * formatDuration(30) // '30秒'
 * formatDuration(90) // '1分30秒'
 * formatDuration(3661) // '1小时1分1秒'
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) return '0秒';
  if (seconds === 0) return '0秒';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}小时`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}分`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}秒`);
  }

  return parts.join('');
}

/**
 * Format remaining time estimate
 *
 * @param seconds - Remaining seconds
 * @returns Formatted time estimate string
 *
 * @example
 * formatRemainingTime(90) // '约1分钟'
 * formatRemainingTime(3661) // '约1小时'
 */
export function formatRemainingTime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '即将完成';

  if (seconds < 60) {
    return `约${Math.ceil(seconds)}秒`;
  }

  if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `约${minutes}分钟`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);

  if (minutes === 60) {
    return `约${hours + 1}小时`;
  }

  return `约${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
}

/**
 * Format number with commas (thousands separator)
 *
 * @param num - Number to format
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567) // '1,234,567'
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('en-US');
}

/**
 * Format percentage
 *
 * @param value - Value between 0 and 100
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(75.5) // '76%'
 * formatPercent(75.5, 1) // '75.5%'
 */
export function formatPercent(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format currency (CNY)
 *
 * @param amount - Amount in cents (1 yuan = 100 cents)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1990) // '¥19.90'
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '¥0.00';
  const yuan = amount / 100;
  return `¥${yuan.toFixed(2)}`;
}

/**
 * Truncate text with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 *
 * @example
 * truncate('Hello World', 5) // 'Hello...'
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate a unique ID
 *
 * @returns Unique ID string
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce function
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 *
 * @param fn - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
