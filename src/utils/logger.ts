/**
 * 前端错误日志工具
 *
 * 功能：
 * - 捕获全局未处理错误和 Promise 异常
 * - 记录 API 请求错误（含请求/响应详情）
 * - 本地存储日志（开发模式可导出查看）
 * - 自动清理过期日志（保留最近 200 条）
 */

export type LogLevel = 'error' | 'warn' | 'info'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  page?: string
  stack?: string
  extra?: Record<string, any>
}

const LOG_STORAGE_KEY = 'app_error_logs'
const MAX_LOGS = 200

/** 获取当前页面路径 */
function getCurrentPage(): string {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    return pages[pages.length - 1].route || 'unknown'
  }
  return 'app'
}

/** 获取本地存储的日志 */
function getStoredLogs(): LogEntry[] {
  try {
    const raw = uni.getStorageSync(LOG_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 保存日志到本地存储 */
function saveLogs(logs: LogEntry[]): void {
  try {
    // 只保留最近 MAX_LOGS 条
    const trimmed = logs.slice(-MAX_LOGS)
    uni.setStorageSync(LOG_STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // 存储满时清理一半
    try {
      const trimmed = logs.slice(-Math.floor(MAX_LOGS / 2))
      uni.setStorageSync(LOG_STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
      // 放弃写入
    }
  }
}

/** 添加一条日志 */
function addLog(level: LogLevel, message: string, extra?: Record<string, any>, stack?: string): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    page: getCurrentPage(),
    stack,
    extra,
  }

  // 控制台输出（开发模式）
  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`
  if (level === 'error') {
    console.error(`${prefix} ${message}`, extra || '', stack || '')
  } else if (level === 'warn') {
    console.warn(`${prefix} ${message}`, extra || '')
  } else {
    console.log(`${prefix} ${message}`, extra || '')
  }

  // 异步写入存储（不阻塞主线程）
  setTimeout(() => {
    const logs = getStoredLogs()
    logs.push(entry)
    saveLogs(logs)
  }, 0)
}

/** 记录 API 请求错误 */
export function logApiError(
  url: string,
  method: string,
  statusCode: number,
  errorMsg: string,
  requestData?: any
): void {
  addLog('error', `API 请求失败: ${method} ${url}`, {
    statusCode,
    errorMsg,
    requestData: requestData ? JSON.stringify(requestData).slice(0, 500) : undefined,
  })
}

/** 记录一般错误 */
export function logError(message: string, error?: Error, extra?: Record<string, any>): void {
  addLog('error', message, extra, error?.stack)
}

/** 记录警告 */
export function logWarn(message: string, extra?: Record<string, any>): void {
  addLog('warn', message, extra)
}

/** 记录信息 */
export function logInfo(message: string, extra?: Record<string, any>): void {
  addLog('info', message, extra)
}

/** 获取所有日志（开发调试用） */
export function getAllLogs(): LogEntry[] {
  return getStoredLogs()
}

/** 清除所有日志 */
export function clearLogs(): void {
  try {
    uni.removeStorageSync(LOG_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** 导出日志为文本（开发调试用） */
export function exportLogs(): string {
  const logs = getStoredLogs()
  return logs.map(l => {
    const extra = l.extra ? ` | ${JSON.stringify(l.extra)}` : ''
    const stack = l.stack ? `\n  ${l.stack}` : ''
    return `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.page}] ${l.message}${extra}${stack}`
  }).join('\n')
}

/** 安装全局错误捕获（在 App.vue onLaunch 中调用） */
export function installGlobalErrorCapture(): void {
  // 捕获 Vue 组件错误
  // uni-app 中通过 App.vue 的 onError 捕获

  // 捕获未处理的 Promise rejection
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason
      logError('未处理的 Promise 异常', reason instanceof Error ? reason : new Error(String(reason)))
    })
    window.addEventListener('error', (event) => {
      logError('全局 JS 错误', event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })
  }
  // #endif

  logInfo('日志系统已启动')
}

export default {
  logApiError,
  logError,
  logWarn,
  logInfo,
  getAllLogs,
  clearLogs,
  exportLogs,
  installGlobalErrorCapture,
}
