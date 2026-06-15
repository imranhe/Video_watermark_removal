const pool = require('../config/database');
const { generateUUID } = require('../utils/helpers');

const pointsLogModel = {
  async create(data) {
    const id = generateUUID();
    await pool.query(
      `INSERT INTO points_logs (id, user_id, task_id, order_id, change_amount, balance_after, type, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        data.user_id,
        data.task_id || null,
        data.order_id || null,
        data.change_amount,
        data.balance_after,
        data.type,
        data.description,
      ]
    );
    return { id, ...data };
  },

  async findByUser(userId, options = {}) {
    const { page = 1, pageSize = 20, offset = 0, type } = options;
    const conditions = ['user_id = ?'];
    const values = [userId];

    if (type) {
      conditions.push('type = ?');
      values.push(type);
    }

    const whereClause = conditions.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM points_logs WHERE ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM points_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  },

  async getBalance(userId) {
    const [rows] = await pool.query(
      'SELECT balance FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    return rows[0] ? rows[0].balance : 0;
  },

  async getSummary(userId) {
    const [rows] = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN change_amount > 0 THEN change_amount ELSE 0 END), 0) AS total_earned,
        COALESCE(SUM(CASE WHEN change_amount < 0 THEN ABS(change_amount) ELSE 0 END), 0) AS total_spent
      FROM points_logs WHERE user_id = ?`,
      [userId]
    );
    return rows[0] || { total_earned: 0, total_spent: 0 };
  },

  /**
   * 积分扣减 - 保证原子操作
   */
  async deductPoints(userId, amount, description, taskId = null) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 查询当前积分
      const [userRows] = await conn.query(
        'SELECT id, balance, version FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );

      if (userRows.length === 0) {
        throw Object.assign(new Error('用户不存在'), { code: 1002 });
      }

      const user = userRows[0];
      if (user.balance < amount) {
        throw Object.assign(new Error('积分不足'), { code: 1003 });
      }

      // 扣减积分（乐观锁）
      const [result] = await conn.query(
        'UPDATE users SET balance = balance - ?, updated_at = NOW(), version = version + 1 WHERE id = ? AND version = ?',
        [amount, userId, user.version]
      );

      if (result.affectedRows === 0) {
        throw new Error('并发更新失败，请重试');
      }

      const newBalance = user.balance - amount;

      // 记录积分日志
      const logId = generateUUID();
      await conn.query(
        `INSERT INTO points_logs (id, user_id, task_id, change_amount, balance_after, type, description, created_at)
         VALUES (?, ?, ?, ?, ?, 'consume', ?, NOW())`,
        [logId, userId, taskId, -amount, newBalance, description]
      );

      await conn.commit();
      return { balance: newBalance, logId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * 积分充值
   */
  async addPoints(userId, amount, description, orderId = null) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [userRows] = await conn.query(
        'SELECT id, balance FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );

      if (userRows.length === 0) {
        throw Object.assign(new Error('用户不存在'), { code: 1002 });
      }

      const user = userRows[0];
      const newBalance = user.balance + amount;

      await conn.query(
        'UPDATE users SET balance = balance + ?, updated_at = NOW() WHERE id = ?',
        [amount, userId]
      );

      const logId = generateUUID();
      await conn.query(
        `INSERT INTO points_logs (id, user_id, order_id, change_amount, balance_after, type, description, created_at)
         VALUES (?, ?, ?, ?, ?, 'recharge', ?, NOW())`,
        [logId, userId, orderId, amount, newBalance, description]
      );

      await conn.commit();
      return { balance: newBalance, logId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = pointsLogModel;
