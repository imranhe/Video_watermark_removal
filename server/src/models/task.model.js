const pool = require('../config/database');
const { generateUUID } = require('../utils/helpers');

const taskModel = {
  async create(data) {
    const id = generateUUID();
    const now = new Date();
    await pool.query(
      `INSERT INTO tasks (id, user_id, video_url, result_url, status, task_type, progress, params, points_cost, priority, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.user_id,
        data.video_url,
        data.result_url || null,
        data.status || 'pending',
        data.task_type,
        0,
        data.params ? JSON.stringify(data.params) : null,
        data.points_cost || 10,
        data.priority || 0,
        now,
        now,
      ]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByUser(userId, options = {}) {
    const { page = 1, pageSize = 20, offset = 0, status, task_type } = options;
    const conditions = ['user_id = ?', 'deleted_at IS NULL'];
    const values = [userId];

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }
    if (task_type) {
      conditions.push('task_type = ?');
      values.push(task_type);
    }

    const whereClause = conditions.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM tasks WHERE ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM tasks WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.video_url !== undefined) {
      fields.push('video_url = ?');
      values.push(data.video_url);
    }
    if (data.result_url !== undefined) {
      fields.push('result_url = ?');
      values.push(data.result_url);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.progress !== undefined) {
      fields.push('progress = ?');
      values.push(data.progress);
    }
    if (data.error_message !== undefined) {
      fields.push('error_message = ?');
      values.push(data.error_message);
    }
    if (data.completed_at !== undefined) {
      fields.push('completed_at = ?');
      values.push(data.completed_at);
    }
    if (data.retry_count !== undefined) {
      fields.push('retry_count = ?');
      values.push(data.retry_count);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    fields.push('version = version + 1');
    values.push(id);

    // 乐观锁
    if (data.expected_version !== undefined) {
      fields.push('version = ?');
      values.push(data.expected_version + 1);
      await pool.query(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND version = ?`,
        [...values, data.expected_version]
      );
    } else {
      await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return this.findById(id);
  },

  async softDelete(id) {
    await pool.query(
      'UPDATE tasks SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  },

  async cancel(id) {
    await pool.query(
      `UPDATE tasks SET status = 'cancelled', updated_at = NOW() WHERE id = ? AND status IN ('pending', 'processing')`,
      [id]
    );
  },

  async getProcessingCount(userId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM tasks WHERE user_id = ? AND status IN ('pending', 'processing') AND deleted_at IS NULL`,
      [userId]
    );
    return rows[0].count;
  },

  async getProgress(id) {
    const [rows] = await pool.query(
      `SELECT id, status, progress, COALESCE(TIMESTAMPDIFF(SECOND, created_at, NOW()), 0) AS elapsed, updated_at
       FROM tasks WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;

    const task = rows[0];
    let estimatedTime = null;
    if (task.status === 'processing' && task.progress > 0) {
      estimatedTime = Math.max(0, Math.round((task.elapsed / task.progress) * (100 - task.progress)));
    }

    return {
      id: task.id,
      status: task.status,
      progress: task.progress,
      estimated_time: estimatedTime,
      updated_at: task.updated_at,
    };
  },
};

module.exports = taskModel;
