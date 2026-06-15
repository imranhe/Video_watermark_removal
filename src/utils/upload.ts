/**
 * 视频上传工具
 * 支持多端适配、分片上传、进度追踪、断点续传
 */

import { ref, computed, watch } from 'vue';
import { getPlatform, isWeixin, isAlipay, isH5 } from './platform';

// 上传状态类型
export type UploadStatus = 'idle' | 'selecting' | 'uploading' | 'paused' | 'completed' | 'failed';

// 上传配置
interface UploadConfig {
  maxFileSize?: number;  // 最大文件大小（MB），默认 100
  chunkSize?: number;    // 分片大小（MB），默认 2
  maxRetries?: number;   // 最大重试次数，默认 3
}

// 视频信息
interface VideoInfo {
  path: string;          // 视频路径
  size: number;          // 文件大小（字节）
  duration: number;      // 视频时长（秒）
  width: number;         // 视频宽度
  height: number;        // 视频高度
  tempFilePath?: string; // 临时文件路径（小程序端）
}

// 上传进度
interface UploadProgress {
  loaded: number;        // 已上传大小（字节）
  total: number;         // 总大小（字节）
  percent: number;       // 进度百分比 (0-100)
  speed: number;         // 上传速度（字节/秒）
  remainingTime: number; // 预计剩余时间（秒）
}

// 分片信息
interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
  uploaded: boolean;
}

// 上传结果
interface UploadResult {
  success: boolean;
  fileId?: string;
  videoUrl?: string;
  error?: string;
}

/**
 * 视频上传 composable
 */
export function useVideoUpload(config: UploadConfig = {}) {
  const {
    maxFileSize = 100,
    chunkSize = 2,
    maxRetries = 3,
  } = config;

  // 状态
  const status = ref<UploadStatus>('idle');
  const videoInfo = ref<VideoInfo | null>(null);
  const progress = ref<UploadProgress>({
    loaded: 0,
    total: 0,
    percent: 0,
    speed: 0,
    remainingTime: 0,
  });
  const error = ref<string | null>(null);
  const fileId = ref<string | null>(null);

  // 分片信息
  const chunks = ref<ChunkInfo[]>([]);
  const uploadedChunks = ref<Set<number>>(new Set());

  // 计算属性
  const isUploading = computed(() => status.value === 'uploading');
  const isPaused = computed(() => status.value === 'paused');
  const isCompleted = computed(() => status.value === 'completed');
  const hasError = computed(() => status.value === 'failed');

  /**
   * 选择视频
   */
  async function selectVideo(): Promise<VideoInfo | null> {
    status.value = 'selecting';
    error.value = null;

    try {
      let video: VideoInfo | null = null;

      // #ifdef MP-WEIXIN
      if (isWeixin()) {
        const res = await new Promise<any>((resolve, reject) => {
          uni.chooseMedia({
            count: 1,
            mediaType: ['video'],
            sourceType: ['album', 'camera'],
            maxDuration: 60,
            success: resolve,
            fail: reject,
          });
        });

        const tempFile = res.tempFiles[0];
        video = {
          path: tempFile.tempFilePath,
          size: tempFile.size,
          duration: tempFile.duration,
          width: tempFile.width,
          height: tempFile.height,
          tempFilePath: tempFile.tempFilePath,
        };
      }
      // #endif

      // #ifdef MP-ALIPAY
      if (isAlipay()) {
        const res = await new Promise<any>((resolve, reject) => {
          my.chooseVideo({
            sourceType: ['album', 'camera'],
            maxDuration: 60,
            success: resolve,
            fail: reject,
          });
        });

        video = {
          path: res.tempFilePath,
          size: res.size,
          duration: res.duration,
          width: res.width,
          height: res.height,
          tempFilePath: res.tempFilePath,
        };
      }
      // #endif

      // #ifdef H5
      if (isH5()) {
        video = await selectVideoH5();
      }
      // #endif

      // 验证文件大小
      if (video && video.size > maxFileSize * 1024 * 1024) {
        throw new Error(`视频文件大小不能超过 ${maxFileSize}MB`);
      }

      videoInfo.value = video;
      status.value = 'idle';
      return video;
    } catch (err: any) {
      error.value = err.message || '选择视频失败';
      status.value = 'failed';
      return null;
    }
  }

  /**
   * H5端选择视频
   */
  function selectVideoH5(): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';

      input.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('未选择文件'));
          return;
        }

        // 获取视频时长
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          resolve({
            path: URL.createObjectURL(file),
            size: file.size,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          });
        };

        video.onerror = () => {
          reject(new Error('无法读取视频文件'));
        };

        video.src = URL.createObjectURL(file);
      };

      input.click();
    });
  }

  /**
   * 生成文件唯一ID
   */
  function generateFileId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 初始化分片信息
   */
  function initChunks(): void {
    if (!videoInfo.value) return;

    const totalSize = videoInfo.value.size;
    const chunkSizeBytes = chunkSize * 1024 * 1024;
    const totalChunks = Math.ceil(totalSize / chunkSizeBytes);

    chunks.value = Array.from({ length: totalChunks }, (_, index) => ({
      index,
      start: index * chunkSizeBytes,
      end: Math.min((index + 1) * chunkSizeBytes, totalSize),
      size: Math.min(chunkSizeBytes, totalSize - index * chunkSizeBytes),
      uploaded: false,
    }));
  }

  /**
   * 上传单个分片
   */
  async function uploadChunk(chunk: ChunkInfo, fileId: string): Promise<boolean> {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

    // #ifdef H5
    if (isH5()) {
      return uploadChunkH5(chunk, fileId);
    }
    // #endif

    // 小程序端：读取文件并上传
    return new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      const fs = uni.getFileSystemManager();
      fs.readFile({
        filePath: videoInfo.value!.tempFilePath!,
        position: chunk.start,
        length: chunk.size,
        success: (res) => {
          const formData = {
            fileId,
            chunkIndex: chunk.index.toString(),
            totalChunks: chunks.value.length.toString(),
          };

          uni.request({
            url: `${API_BASE}/api/upload/chunk`,
            method: 'POST',
            data: res.data,
            header: {
              'Content-Type': 'application/octet-stream',
              ...formData,
            },
            success: (response) => {
              if (response.statusCode === 200) {
                uploadedChunks.value.add(chunk.index);
                resolve(true);
              } else {
                reject(new Error(`分片 ${chunk.index} 上传失败`));
              }
            },
            fail: reject,
          });
        },
        fail: reject,
      });
      // #endif
    });
  }

  /**
   * H5端上传分片
   */
  async function uploadChunkH5(chunk: ChunkInfo, fileId: string): Promise<boolean> {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', `${API_BASE}/api/upload/chunk`, true);

      // 设置请求头
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.setRequestHeader('X-File-Id', fileId);
      xhr.setRequestHeader('X-Chunk-Index', chunk.index.toString());
      xhr.setRequestHeader('X-Total-Chunks', chunks.value.length.toString());

      xhr.onload = () => {
        if (xhr.status === 200) {
          uploadedChunks.value.add(chunk.index);
          resolve(true);
        } else {
          reject(new Error(`分片 ${chunk.index} 上传失败`));
        }
      };

      xhr.onerror = () => reject(new Error('网络错误'));

      // 读取文件分片
      uni.request({
        url: videoInfo.value!.path,
        responseType: 'arraybuffer',
        success: (res) => {
          const buffer = res.data as ArrayBuffer;
          const chunkData = buffer.slice(chunk.start, chunk.end);
          xhr.send(chunkData);
        },
        fail: reject
      });
    });
  }

  /**
   * 合并分片
   */
  async function mergeChunks(fileId: string): Promise<UploadResult> {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

    return new Promise((resolve, reject) => {
      uni.request({
        url: `${API_BASE}/api/upload/merge`,
        method: 'POST',
        data: {
          fileId,
          filename: `video_${fileId}.mp4`,
        },
        success: (response) => {
          if (response.statusCode === 200) {
            resolve({
              success: true,
              fileId,
              videoUrl: (response.data as any).videoUrl,
            });
          } else {
            reject(new Error('合并分片失败'));
          }
        },
        fail: reject,
      });
    });
  }

  /**
   * 开始上传
   */
  async function startUpload(): Promise<UploadResult> {
    if (!videoInfo.value) {
      throw new Error('请先选择视频');
    }

    status.value = 'uploading';
    error.value = null;
    progress.value = {
      loaded: 0,
      total: videoInfo.value.size,
      percent: 0,
      speed: 0,
      remainingTime: 0,
    };

    // 生成文件ID
    fileId.value = generateFileId();

    // 初始化分片
    initChunks();

    const startTime = Date.now();
    let lastLoaded = 0;

    try {
      // 顺序上传分片（可改为并发上传提高效率）
      for (const chunk of chunks.value) {
        if ((status.value as UploadStatus) === 'paused') {
          // 暂停状态，等待恢复
          await new Promise<void>((resolve) => {
            const unwatch = watch(isPaused, (paused: boolean) => {
              if (!paused) {
                unwatch();
                resolve();
              }
            });
          });
        }

        // 检查是否已上传（断点续传）
        if (uploadedChunks.value.has(chunk.index)) {
          continue;
        }

        // 上传分片
        await uploadChunk(chunk, fileId.value);

        // 更新进度
        const currentTime = Date.now();
        const elapsed = (currentTime - startTime) / 1000;
        const loaded = uploadedChunks.value.size * chunkSize * 1024 * 1024;

        progress.value = {
          loaded,
          total: videoInfo.value.size,
          percent: Math.round((loaded / videoInfo.value.size) * 100),
          speed: loaded / elapsed,
          remainingTime: (videoInfo.value.size - loaded) / (loaded / elapsed),
        };

        lastLoaded = loaded;
      }

      // 所有分片上传完成，合并分片
      const result = await mergeChunks(fileId.value);

      status.value = 'completed';
      progress.value.percent = 100;

      return result;
    } catch (err: any) {
      error.value = err.message || '上传失败';
      status.value = 'failed';
      throw err;
    }
  }

  /**
   * 暂停上传
   */
  function pauseUpload(): void {
    if (status.value === 'uploading') {
      status.value = 'paused';
    }
  }

  /**
   * 恢复上传
   */
  function resumeUpload(): void {
    if (status.value === 'paused') {
      status.value = 'uploading';
    }
  }

  /**
   * 重置状态
   */
  function reset(): void {
    status.value = 'idle';
    videoInfo.value = null;
    progress.value = {
      loaded: 0,
      total: 0,
      percent: 0,
      speed: 0,
      remainingTime: 0,
    };
    error.value = null;
    fileId.value = null;
    chunks.value = [];
    uploadedChunks.value.clear();
  }

  return {
    // 状态
    status,
    videoInfo,
    progress,
    error,
    fileId,
    chunks,
    uploadedChunks,

    // 计算属性
    isUploading,
    isPaused,
    isCompleted,
    hasError,

    // 方法
    selectVideo,
    startUpload,
    pauseUpload,
    resumeUpload,
    reset,
  };
}
