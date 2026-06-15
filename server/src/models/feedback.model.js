const pool = require('../config/database');
const { generateUUID } = require('../utils/helpers');

const feedbackModel = {
  async create(data) {
    const id = generateUUID();
    const now = new Date();
    await pool.query(
      `INSERT INTO feedbacks (id, user_id, type, content, contact, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [id, data.user_id, data.type, data.content, data.contact || null, now, now]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM feedbacks WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByUser(userId, options = {}) {
    const { page = 1, pageSize = 20, offset = 0, status } = options;
    const conditions = ['user_id = ?'];
    const values = [userId];

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }

    const whereClause = conditions.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM feedbacks WHERE ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM feedbacks WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  },
};

module.exports = feedbackModel;
