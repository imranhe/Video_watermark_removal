const pool = require('../config/database');
const { generateUUID } = require('../utils/helpers');

const notificationModel = {
  async create(data) {
    const id = generateUUID();
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        data.user_id,
        data.type,
        data.title,
        data.content,
        data.is_read || false,
      ]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByUser(userId, options = {}) {
    const { page = 1, pageSize = 20, offset = 0, is_read } = options;
    const conditions = ['user_id = ?'];
    const values = [userId];

    if (is_read !== undefined) {
      conditions.push('is_read = ?');
      values.push(is_read);
    }

    const whereClause = conditions.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM notifications WHERE ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    const [unreadCountRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = false',
      [userId]
    );

    return {
      list: rows,
      total,
      unread_count: unreadCountRows[0].count,
    };
  },

  async markAsRead(id, userId) {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  },

  async markAllAsRead(userId) {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false',
      [userId]
    );
    return result.affectedRows;
  },
};

module.exports = notificationModel;
