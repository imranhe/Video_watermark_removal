const pool = require('../config/database');
const { generateUUID } = require('../utils/helpers');

const userModel = {
  async findByOpenid(openid) {
    const [rows] = await pool.query('SELECT * FROM users WHERE openid = ? LIMIT 1', [openid]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const id = generateUUID();
    const now = new Date();
    await pool.query(
      `INSERT INTO users (id, openid, nickname, avatar_url, balance, vip_type, vip_expire_at, total_tasks, total_spent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.openid,
        data.nickname || '微信用户',
        data.avatar_url || null,
        data.balance || 30, // 默认赠送 30 积分
        data.vip_type || 'none',
        data.vip_expire_at || null,
        0,
        0,
        now,
        now,
      ]
    );
    return this.findById(id);
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(data.nickname);
    }
    if (data.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(data.avatar_url);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.balance !== undefined) {
      fields.push('balance = ?');
      values.push(data.balance);
    }
    if (data.vip_type !== undefined) {
      fields.push('vip_type = ?');
      values.push(data.vip_type);
    }
    if (data.vip_expire_at !== undefined) {
      fields.push('vip_expire_at = ?');
      values.push(data.vip_expire_at);
    }
    if (data.total_tasks !== undefined) {
      fields.push('total_tasks = ?');
      values.push(data.total_tasks);
    }
    if (data.total_spent !== undefined) {
      fields.push('total_spent = ?');
      values.push(data.total_spent);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async getStats(userId) {
    const [rows] = await pool.query(
      `SELECT
        u.balance, u.vip_type, u.vip_expire_at, u.total_tasks, u.total_spent,
        (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'completed') AS completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'failed') AS failed_tasks,
        (SELECT COALESCE(SUM(change_amount), 0) FROM points_logs WHERE user_id = ? AND change_amount < 0) AS total_points_used,
        (SELECT COALESCE(SUM(change_amount), 0) FROM points_logs WHERE user_id = ? AND change_amount > 0) AS total_points_recharged
      FROM users u WHERE u.id = ?`,
      [userId, userId, userId, userId, userId]
    );
    return rows[0] || null;
  },
};

module.exports = userModel;
