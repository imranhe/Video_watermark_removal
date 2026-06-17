const pool = require('../config/database');
const { generateUUID } = require('../utils/helpers');

const announcementModel = {
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findAll(options = {}) {
    const { page = 1, pageSize = 20, offset = 0, status } = options;
    const conditions = [];
    const values = [];

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM announcements ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM announcements ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  },

  async create(data) {
    const id = generateUUID();
    const now = new Date();
    await pool.query(
      `INSERT INTO announcements (id, title, content, status, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.title, data.content, data.status || 'draft', data.published_at || null, now, now]
    );
    return this.findById(id);
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.content !== undefined) {
      fields.push('content = ?');
      values.push(data.content);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.published_at !== undefined) {
      fields.push('published_at = ?');
      values.push(data.published_at);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
  },
};

module.exports = announcementModel;
