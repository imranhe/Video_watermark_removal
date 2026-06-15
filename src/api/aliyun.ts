/**
 * 阿里云 MPS 视频处理接口封装
 * 支持去字幕、去水印功能
 */

import { get, post } from './request';

// 阿里云配置
interface AliyunConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
  inputBucket: string;
  outputBucket: string;
}

// 任务类型
type ProcessType = 'subtitle' | 'icon';

// 处理参数
interface ProcessParams {
  // 字幕位置（归一化坐标 0-1）
  subtitleRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // 水印位置
  watermarkRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 任务状态
interface TaskState {
  jobId: string;
  status: 'Submitted' | 'Processing' | 'Success' | 'Fail';
  progress: number;
  inputUrl: string;
  outputUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

// 提交任务响应
interface SubmitJobResponse {
  jobId: string;
  requestId: string;
}

/**
 * 阿里云 MPS 客户端
 */
export class AliyunMPSClient {
  private config: AliyunConfig;

  constructor(config: AliyunConfig) {
    this.config = config;
  }

  /**
   * 提交视频处理任务
   */
  async submitJob(
    videoUrl: string,
    processType: ProcessType,
    params: ProcessParams = {}
  ): Promise<SubmitJobResponse> {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

    // 通过后端调用阿里云接口（避免前端暴露 AccessKey）
    const response = await post<SubmitJobResponse>(`${API_BASE}/api/aliyun/submit-job`, {
      videoUrl,
      processType,
      params,
      config: {
        region: this.config.region,
        inputBucket: this.config.inputBucket,
        outputBucket: this.config.outputBucket,
      },
    });

    return response.data;
  }

  /**
   * 查询任务状态
   */
  async queryJob(jobId: string): Promise<TaskState> {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

    const response = await get<TaskState>(`${API_BASE}/api/aliyun/query-job/${jobId}`);
    return response.data;
  }

  /**
   * 批量查询任务状态
   */
  async queryJobs(jobIds: string[]): Promise<TaskState[]> {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

    const response = await post<TaskState[]>(`${API_BASE}/api/aliyun/query-jobs`, {
      jobIds,
    });
    return response.data;
  }
}

/**
 * 创建阿里云 MPS 客户端实例
 */
export function createMPSClient(): AliyunMPSClient {
  const config: AliyunConfig = {
    accessKeyId: import.meta.env.VITE_ALIYUN_ACCESS_KEY_ID || '',
    accessKeySecret: import.meta.env.VITE_ALIYUN_ACCESS_KEY_SECRET || '',
    region: import.meta.env.VITE_ALIYUN_REGION || 'cn-hangzhou',
    inputBucket: import.meta.env.VITE_ALIYUN_INPUT_BUCKET || '',
    outputBucket: import.meta.env.VITE_ALIYUN_OUTPUT_BUCKET || '',
  };

  return new AliyunMPSClient(config);
}

/**
 * 默认客户端实例
 */
export const mpsClient = createMPSClient();

/**
 * 生成字幕区域参数（根据视频尺寸和位置）
 */
export function generateSubtitleRegion(
  videoWidth: number,
  videoHeight: number,
  position: 'bottom' | 'top' | 'custom',
  customRegion?: { x: number; y: number; width: number; height: number }
): ProcessParams {
  if (position === 'custom' && customRegion) {
    return {
      subtitleRegion: {
        x: customRegion.x / videoWidth,
        y: customRegion.y / videoHeight,
        width: customRegion.width / videoWidth,
        height: customRegion.height / videoHeight,
      },
    };
  }

  // 默认字幕区域（底部 10% 区域）
  const defaultHeight = 0.1;
  const defaultY = position === 'bottom' ? 1 - defaultHeight : 0;

  return {
    subtitleRegion: {
      x: 0,
      y: defaultY,
      width: 1,
      height: defaultHeight,
    },
  };
}

/**
 * 生成水印区域参数
 */
export function generateWatermarkRegion(
  videoWidth: number,
  videoHeight: number,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  size: { width: number; height: number }
): ProcessParams {
  const margin = 0.02; // 2% 边距
  const normalizedWidth = size.width / videoWidth;
  const normalizedHeight = size.height / videoHeight;

  let x = margin;
  let y = margin;

  switch (position) {
    case 'top-right':
      x = 1 - normalizedWidth - margin;
      break;
    case 'bottom-left':
      y = 1 - normalizedHeight - margin;
      break;
    case 'bottom-right':
      x = 1 - normalizedWidth - margin;
      y = 1 - normalizedHeight - margin;
      break;
  }

  return {
    watermarkRegion: {
      x,
      y,
      width: normalizedWidth,
      height: normalizedHeight,
    },
  };
}
