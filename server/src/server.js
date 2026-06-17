const app = require('./app');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 3000;

// 确保上传目录存在
const fs = require('fs');
const path = require('path');
const uploadDir = path.resolve(__dirname, '../uploads');
const processedDir = path.resolve(uploadDir, 'processed');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

const server = app.listen(PORT, () => {
  logger.info(`服务器启动成功 - 端口: ${PORT}`);
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API 基础路径: http://localhost:${PORT}/v1`);
});

/**
 * 优雅关闭：依次关闭 HTTP 服务器、Redis、MySQL、BullMQ
 */
async function gracefulShutdown(signal) {
  logger.info(`收到 ${signal} 信号，正在关闭服务器...`);

  // 10 秒超时强制退出
  const forceExit = setTimeout(() => {
    logger.error('优雅关闭超时，强制退出');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  // 1. 关闭 HTTP 服务器（停止接受新连接）
  server.close(async () => {
    try {
      // 2. 关闭限流 Redis 客户端
      try {
        const { closeRedisClient } = require('./middleware/rate-limit.middleware');
        await closeRedisClient();
        logger.info('限流 Redis 客户端已关闭');
      } catch (e) { /* 可能未初始化 */ }

      // 3. 关闭 BullMQ worker、scheduler 和 queue
      try {
        const taskProcessor = require('./jobs/task-processor');
        if (taskProcessor.taskWorker) {
          await taskProcessor.taskWorker.close();
          logger.info('BullMQ Worker 已关闭');
        }
        if (taskProcessor.queueScheduler) {
          await taskProcessor.queueScheduler.close();
          logger.info('BullMQ QueueScheduler 已关闭');
        }
        if (taskProcessor.taskQueue) {
          await taskProcessor.taskQueue.close();
          logger.info('BullMQ Queue 已关闭');
        }
      } catch (e) { /* 可能未初始化 */ }

      // 4. 关闭 MySQL 连接池
      try {
        const pool = require('./config/database');
        await pool.end();
        logger.info('MySQL 连接池已关闭');
      } catch (e) { /* 可能未初始化 */ }

      clearTimeout(forceExit);
      logger.info('服务器已优雅关闭');
      process.exit(0);
    } catch (err) {
      logger.error('优雅关闭过程中出错:', err);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('未处理的 Promise 拒绝:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常:', err);
  process.exit(1);
});

module.exports = server;
