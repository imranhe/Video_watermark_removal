const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');
const mpsClient = require('../integrations/aliyun-mps');
const ossClient = require('../integrations/aliyun-oss');
const taskModel = require('../models/task.model');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Redis connection for BullMQ
 */
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

/**
 * QueueScheduler — 确保延迟任务和重试任务正常调度
 */
const queueScheduler = new QueueScheduler('task-processing', {
  connection,
});

/**
 * Task processing queue
 */
const taskQueue = new Queue('task-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

/**
 * Poll MPS job status until completion (独立函数，避免 this 上下文问题）
 */
async function pollJobStatus(taskId, mpsJobId, maxAttempts = 120) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const jobStatus = await mpsClient.queryJob(mpsJobId);

    // Update progress
    const progress = Math.min(90, 10 + Math.round(jobStatus.progress * 0.8));
    await taskModel.update(taskId, { progress });

    if (jobStatus.status === 'completed') {
      const resultUrl = jobStatus.outputUrl;

      await taskModel.update(taskId, {
        status: 'completed',
        progress: 100,
        result_url: resultUrl,
        completed_at: new Date(),
      });

      // Send notification
      try {
        const task = await taskModel.findById(taskId);
        if (task) {
          await notificationService.sendTaskCompleteNotification(task.user_id, taskId);
        }
      } catch (notifError) {
        logger.error('Failed to send task completion notification', {
          taskId,
          error: notifError.message,
        });
      }

      logger.info(`Task ${taskId} completed successfully`);
      return;
    }

    if (jobStatus.status === 'failed') {
      throw new Error(jobStatus.errorMessage || 'MPS processing failed');
    }

    if (jobStatus.status === 'cancelled') {
      throw new Error('Task was cancelled');
    }

    // Wait 5 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error('MPS job polling timeout');
}

/**
 * Task processing worker
 */
const taskWorker = new Worker(
  'task-processing',
  async (job) => {
    const { taskId, videoUrl, taskType, region } = job.data;
    logger.info(`Processing task ${taskId}`, { taskType, attempt: job.attemptsMade + 1 });

    try {
      // Update task status to processing
      await taskModel.update(taskId, {
        status: 'processing',
        progress: 10,
      });

      // Generate output URL
      const outputKey = ossClient.extractKey(videoUrl).replace(
        'videos/original',
        'videos/processed'
      );
      const outputUrl = ossClient.getPublicUrl(outputKey);

      // Submit to Aliyun MPS
      const mpsResult = await mpsClient.submitJob(videoUrl, outputUrl, taskType, {
        region: region || undefined,
      });

      if (!mpsResult.success || !mpsResult.jobId) {
        throw new Error('Failed to submit MPS job');
      }

      logger.info(`MPS job submitted for task ${taskId}`, { mpsJobId: mpsResult.jobId });

      // Poll for job completion（使用独立函数，无上下文问题）
      await pollJobStatus(taskId, mpsResult.jobId);

      return { taskId, mpsJobId: mpsResult.jobId };
    } catch (error) {
      logger.error(`Task ${taskId} processing failed`, {
        error: error.message,
        attempt: job.attemptsMade + 1,
      });

      // Mark task as failed on final attempt
      if (job.attemptsMade >= 2) {
        await taskModel.update(taskId, {
          status: 'failed',
          error_message: error.message || 'Processing failed',
        });
      }

      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 tasks concurrently
  }
);

/**
 * Handle worker events
 */
taskWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`, { taskId: job.data.taskId });
});

taskWorker.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed`, {
    taskId: job.data.taskId,
    error: error.message,
    attempts: job.attemptsMade,
  });
});

taskWorker.on('error', (error) => {
  logger.error('Task worker error', { error: error.message });
});

/**
 * Task Queue Manager
 */
const taskQueueManager = {
  /**
   * Add task to processing queue
   */
  async addTask(taskId, videoUrl, taskType, region = null) {
    const job = await taskQueue.add('process-video', {
      taskId,
      videoUrl,
      taskType,
      region,
    });

    logger.info(`Task ${taskId} added to queue`, { jobId: job.id });
    return job.id;
  },

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    const job = await taskQueue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress,
      data: job.data,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
    };
  },

  /**
   * Cancel job
   */
  async cancelJob(jobId) {
    const job = await taskQueue.getJob(jobId);
    if (!job) return false;

    await job.remove();
    logger.info(`Job ${jobId} cancelled`);
    return true;
  },

  /**
   * Get queue metrics
   */
  async getMetrics() {
    const [waiting, active, completed, failed] = await Promise.all([
      taskQueue.getWaitingCount(),
      taskQueue.getActiveCount(),
      taskQueue.getCompletedCount(),
      taskQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  },

  /**
   * Pause queue
   */
  async pause() {
    await taskQueue.pause();
    logger.info('Task queue paused');
  },

  /**
   * Resume queue
   */
  async resume() {
    await taskQueue.resume();
    logger.info('Task queue resumed');
  },
};

module.exports = {
  taskQueue,
  taskWorker,
  queueScheduler,
  taskQueueManager,
};
