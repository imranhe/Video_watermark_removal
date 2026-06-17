const taskModel = require('../models/task.model');
const pointsLogModel = require('../models/points-log.model');
const systemConfigModel = require('../models/system-config.model');
const userModel = require('../models/user.model');
const ossClient = require('../integrations/aliyun-oss');
const { taskQueueManager } = require('../jobs/task-processor');
const logger = require('../utils/logger');

const TASK_POINTS_COST = {
  subtitle: 10,
  watermark: 15,
  logo: 15,
};

const taskService = {
  async createTask(userId, taskType, videoFile, region = null) {
    // 检查用户
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 1002;
      throw error;
    }

    // 获取处理配置中的积分消耗
    const pointsCost = TASK_POINTS_COST[taskType] || 10;

    // VIP 用户不需要扣积分
    const isVip = user.vip_type && user.vip_type !== 'none'
      && user.vip_expire_at && new Date(user.vip_expire_at) > new Date();

    if (!isVip) {
      // 扣减积分（原子操作）
      try {
        await pointsLogModel.deductPoints(
          userId,
          pointsCost,
          `处理视频任务（${taskType}）`,
          null // task id assigned after creation
        );
      } catch (err) {
        if (err.code === 1003) {
          throw err; // 积分不足
        }
        throw err;
      }
    }

    // Upload video to OSS (if not already uploaded)
    let videoUrl = videoFile.path;
    if (process.env.OSS_ACCESS_KEY_ID && !videoFile.path.startsWith('https://')) {
      try {
        const uploadResult = await ossClient.uploadVideo(
          videoFile.path,
          userId,
          videoFile.originalname
        );
        videoUrl = uploadResult.url;
        logger.info('Video uploaded to OSS', { userId, ossUrl: videoUrl });
      } catch (ossError) {
        logger.error('Failed to upload video to OSS, using local path', {
          userId,
          error: ossError.message,
        });
        // Fallback to local path
        videoUrl = `/uploads/${videoFile.filename}`;
      }
    }

    // Create task
    const params = region ? { region } : null;
    const task = await taskModel.create({
      user_id: userId,
      video_url: videoUrl,
      task_type: taskType,
      params,
      points_cost: isVip ? 0 : pointsCost,
    });

    // Update user statistics
    await userModel.update(userId, { total_tasks: (user.total_tasks || 0) + 1 });

    // Add task to BullMQ processing queue
    try {
      const jobId = await taskQueueManager.addTask(task.id, videoUrl, taskType, region);
      logger.info('Task added to processing queue', { taskId: task.id, jobId });
    } catch (queueError) {
      logger.error('Failed to add task to queue, processing inline', {
        taskId: task.id,
        error: queueError.message,
      });
      // Fallback: process inline (for development/testing)
      this._processTaskAsync(task.id).catch((err) => {
        logger.error(`任务处理失败: ${task.id}`, err);
      });
    }

    return {
      id: task.id,
      user_id: task.user_id,
      video_url: task.video_url,
      task_type: task.task_type,
      status: task.status,
      progress: task.progress,
      points_cost: isVip ? 0 : pointsCost,
      created_at: task.created_at,
    };
  },

  /**
   * Legacy async processing (fallback when queue unavailable)
   */
  async _processTaskAsync(taskId) {
    // 在实际生产环境中，这里会调用 Bull 队列或直接调用处理服务
    // 这里模拟任务处理流程
    try {
      await taskModel.update(taskId, { status: 'processing', progress: 5 });
      // 模拟处理时间
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await taskModel.update(taskId, { status: 'processing', progress: 30 });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await taskModel.update(taskId, { status: 'processing', progress: 60 });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await taskModel.update(taskId, { status: 'processing', progress: 90 });
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 模拟处理完成
      const resultUrl = `/uploads/processed/${taskId}_result.mp4`;
      await taskModel.update(taskId, {
        status: 'completed',
        progress: 100,
        result_url: resultUrl,
        completed_at: new Date(),
      });

      logger.info(`任务处理完成: ${taskId}`);
    } catch (err) {
      logger.error(`任务处理异常: ${taskId}`, err);
      await taskModel.update(taskId, {
        status: 'failed',
        error_message: err.message || '处理异常',
      });
    }
  },

  async getTaskList(userId, options = {}) {
    const result = await taskModel.findByUser(userId, options);
    return {
      list: result.list,
      pagination: {
        page: options.page || 1,
        page_size: options.pageSize || 20,
        total: result.total,
        total_pages: Math.ceil(result.total / (options.pageSize || 20)),
      },
    };
  },

  async getTaskDetail(taskId, userId) {
    const task = await taskModel.findById(taskId);
    if (!task || task.user_id !== userId) {
      const error = new Error('任务不存在');
      error.code = 1004;
      throw error;
    }

    let params = null;
    if (task.params) {
      try {
        params = typeof task.params === 'string' ? JSON.parse(task.params) : task.params;
      } catch {
        params = task.params;
      }
    }

    return {
      id: task.id,
      user_id: task.user_id,
      video_url: task.video_url,
      result_url: task.result_url,
      task_type: task.task_type,
      status: task.status,
      progress: task.progress,
      points_cost: task.points_cost || 0,
      params,
      error_message: task.error_message,
      retry_count: task.retry_count || 0,
      priority: task.priority || 0,
      created_at: task.created_at,
      completed_at: task.completed_at,
    };
  },

  async getTaskProgress(taskId, userId) {
    const task = await taskModel.findById(taskId);
    if (!task || task.user_id !== userId) {
      const error = new Error('任务不存在');
      error.code = 1004;
      throw error;
    }

    return taskModel.getProgress(taskId);
  },

  async retryTask(taskId, userId) {
    const task = await taskModel.findById(taskId);
    if (!task || task.user_id !== userId) {
      const error = new Error('任务不存在');
      error.code = 1004;
      throw error;
    }

    if (task.status !== 'failed') {
      const error = new Error('只有失败的任务可以重新处理');
      error.code = 400;
      throw error;
    }

    if ((task.retry_count || 0) >= 3) {
      const error = new Error('已达到最大重试次数');
      error.code = 1007;
      error.detail = 'TASK_RETRY_FAILED';
      throw error;
    }

    const updatedTask = await taskModel.update(taskId, {
      status: 'pending',
      progress: 0,
      error_message: null,
      retry_count: (task.retry_count || 0) + 1,
    });

    // 重新提交到 BullMQ 真实队列处理
    try {
      const jobId = await taskQueueManager.addTask(taskId, task.video_url, task.task_type, task.params?.region);
      logger.info('任务已重新提交到处理队列', { taskId, jobId });
    } catch (queueError) {
      logger.error('任务重新入队失败，使用内联回退处理', {
        taskId,
        error: queueError.message,
      });
      // 回退：内联处理（仅开发/测试用）
      this._processTaskAsync(taskId).catch((err) => {
        logger.error(`任务重试失败: ${taskId}`, err);
      });
    }

    return {
      id: updatedTask.id,
      status: updatedTask.status,
      progress: updatedTask.progress,
      retry_count: updatedTask.retry_count,
      created_at: updatedTask.created_at,
    };
  },

  async cancelTask(taskId, userId) {
    const task = await taskModel.findById(taskId);
    if (!task || task.user_id !== userId) {
      const error = new Error('任务不存在');
      error.code = 1004;
      throw error;
    }

    if (!['pending', 'processing'].includes(task.status)) {
      const error = new Error('只有待处理或处理中的任务可以取消');
      error.code = 400;
      throw error;
    }

    await taskModel.cancel(taskId);

    // 退还积分
    if (task.points_cost > 0) {
      try {
        await pointsLogModel.addPoints(
          userId,
          task.points_cost,
          `取消任务退还积分`,
          null
        );
      } catch (err) {
        logger.error(`取消任务退还积分失败: ${taskId}`, err);
      }
    }

    return {
      id: taskId,
      status: 'cancelled',
      points_refunded: task.points_cost || 0,
    };
  },

  async deleteTask(taskId, userId) {
    const task = await taskModel.findById(taskId);
    if (!task || task.user_id !== userId) {
      const error = new Error('任务不存在');
      error.code = 1004;
      throw error;
    }

    if (!['completed', 'failed', 'cancelled'].includes(task.status)) {
      const error = new Error('只有已完成或失败的任务可以删除');
      error.code = 400;
      throw error;
    }

    await taskModel.softDelete(taskId);
    return { id: taskId, deleted: true };
  },

  async parseLink(url) {
    // 从 URL 检测平台
    const platforms = {
      'douyin.com': '抖音',
      'iesdouyin.com': '抖音',
      'kuaishou.com': '快手',
      'gifshow.com': '快手',
      'xiaohongshu.com': '小红书',
      'bilibili.com': 'B站',
      'b23.tv': 'B站',
      'weibo.com': '微博',
      'weibo.cn': '微博',
      'ixigua.com': '西瓜视频',
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'instagram.com': 'Instagram',
      'tiktok.com': 'TikTok',
    };

    const hostname = new URL(url).hostname;
    const platform = Object.entries(platforms).find(([key]) => hostname.includes(key));
    if (!platform) {
      const error = new Error('不支持的视频平台');
      error.code = 1009;
      throw error;
    }

    // 注意：生产环境应调用真实视频解析 API（如第三方服务）
    // 当前返回桩响应，表示平台已识别
    return {
      platform: platform[1],
      title: '视频解析成功',
      videoUrl: url,
      duration: 0,
      coverUrl: '',
      supported: true,
    };
  },

  async createFromLink(userId, url, taskType = 'subtitle', region = null) {
    // 先解析链接以验证
    const linkInfo = await this.parseLink(url);

    // 检查用户
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 1002;
      throw error;
    }

    // 获取积分消耗
    const pointsCost = TASK_POINTS_COST[taskType] || 10;

    // VIP 用户不需要扣积分
    const isVip = user.vip_type && user.vip_type !== 'none'
      && user.vip_expire_at && new Date(user.vip_expire_at) > new Date();

    if (!isVip) {
      // 扣减积分（原子操作）
      try {
        await pointsLogModel.deductPoints(
          userId,
          pointsCost,
          `链接解析任务（${taskType}）`,
          null
        );
      } catch (err) {
        if (err.code === 1003) {
          throw err; // 积分不足
        }
        throw err;
      }
    }

    // 创建任务，将 URL 作为 video_url
    const params = region
      ? { region, sourceUrl: url, platform: linkInfo.platform }
      : { sourceUrl: url, platform: linkInfo.platform };
    const task = await taskModel.create({
      user_id: userId,
      video_url: url,
      task_type: taskType,
      params,
      points_cost: isVip ? 0 : pointsCost,
    });

    // 更新用户统计
    await userModel.update(userId, { total_tasks: (user.total_tasks || 0) + 1 });

    // 添加到处理队列
    try {
      const jobId = await taskQueueManager.addTask(task.id, url, taskType, region);
      logger.info('链接任务已添加到处理队列', { taskId: task.id, jobId });
    } catch (queueError) {
      logger.warn('添加到队列失败，使用内联处理', { error: queueError.message });
      this._processTaskAsync(task.id).catch((err) => {
        logger.error(`链接任务处理失败: ${task.id}`, err);
      });
    }

    return {
      id: task.id,
      status: task.status,
      task_type: task.task_type,
      points_cost: isVip ? 0 : pointsCost,
      platform: linkInfo.platform,
    };
  },

  async getDownloadUrl(taskId, userId) {
    const task = await taskModel.findById(taskId);
    if (!task || task.user_id !== userId) {
      const error = new Error('任务不存在');
      error.code = 1004;
      throw error;
    }

    if (task.status !== 'completed' || !task.result_url) {
      const error = new Error('任务尚未完成');
      error.code = 400;
      throw error;
    }

    // Generate pre-signed URL for OSS download
    try {
      if (task.result_url.startsWith('https://') && process.env.OSS_ACCESS_KEY_ID) {
        const ossKey = ossClient.extractKey(task.result_url);
        const downloadUrl = await ossClient.getSignedUrl(ossKey, 3600);

        // Get file metadata
        let fileSize = 0;
        try {
          const metadata = await ossClient.getMetadata(ossKey);
          fileSize = metadata.size;
        } catch (metaError) {
          logger.warn('Failed to get file metadata', { ossKey, error: metaError.message });
        }

        return {
          download_url: downloadUrl,
          expires_in: 3600,
          file_size: fileSize,
          duration: 0, // TODO: Extract from video metadata
        };
      }

      // Fallback to local file
      return {
        download_url: task.result_url,
        expires_in: 3600,
        file_size: 0,
        duration: 0,
      };
    } catch (error) {
      logger.error('Failed to generate download URL', { taskId, error: error.message });
      throw error;
    }
  },
};

module.exports = taskService;
