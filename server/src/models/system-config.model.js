const pool = require('../config/database');

const systemConfigModel = {
  async get(key) {
    const [rows] = await pool.query(
      'SELECT config_value FROM system_configs WHERE config_key = ? LIMIT 1',
      [key]
    );
    return rows[0] ? rows[0].config_value : null;
  },

  async set(key, value, description = null) {
    const exists = await this.get(key);
    if (exists !== null) {
      await pool.query(
        'UPDATE system_configs SET config_value = ?, updated_at = NOW() WHERE config_key = ?',
        [value, key]
      );
    } else {
      const { generateUUID } = require('../utils/helpers');
      await pool.query(
        'INSERT INTO system_configs (id, config_key, config_value, description, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [generateUUID(), key, value, description]
      );
    }
  },

  async getConfigMap() {
    const [rows] = await pool.query('SELECT config_key, config_value FROM system_configs');
    const configMap = {};
    for (const row of rows) {
      try {
        configMap[row.config_key] = JSON.parse(row.config_value);
      } catch {
        configMap[row.config_key] = row.config_value;
      }
    }
    return configMap;
  },

  async getProcessingConfig() {
    const configs = [
      { task_type: 'subtitle', points_cost: 10, max_duration_seconds: 300, max_file_size_mb: 100, description: '视频去字幕' },
      { task_type: 'watermark', points_cost: 15, max_duration_seconds: 300, max_file_size_mb: 100, description: '视频去水印' },
      { task_type: 'logo', points_cost: 15, max_duration_seconds: 300, max_file_size_mb: 100, description: '视频去图标' },
    ];

    // 尝试从数据库读取覆盖配置
    const dbConfig = await this.get('processing_config');
    if (dbConfig) {
      try {
        const parsed = JSON.parse(dbConfig);
        return parsed.list || configs;
      } catch {
        return configs;
      }
    }
    return configs;
  },
};

module.exports = systemConfigModel;
