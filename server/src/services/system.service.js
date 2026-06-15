const systemConfigModel = require('../models/system-config.model');

const systemService = {
  async getSystemConfig() {
    const configMap = await systemConfigModel.getConfigMap();
    return {
      free_trial_credits: 30,
      max_video_duration: configMap.max_video_duration || 300,
      max_video_size: configMap.max_video_size || 100,
      task_timeout: configMap.task_timeout || 600,
      retry_count: configMap.retry_count || 3,
      vip_priority: configMap.vip_priority !== 'false',
      content_check: configMap.content_check !== 'false',
      maintenance_mode: configMap.maintenance_mode === 'true',
      announcement: configMap.announcement
        ? (typeof configMap.announcement === 'string'
          ? JSON.parse(configMap.announcement)
          : configMap.announcement)
        : null,
    };
  },

  async getProcessingConfig() {
    const configs = await systemConfigModel.getProcessingConfig();
    return { list: configs };
  },
};

module.exports = systemService;
