const pool = require('../config/database');
const { generateUUID } = require('../utils/helpers');

const faqModel = {
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM faqs WHERE id = ? LIMIT 1', [id]);
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
      `SELECT COUNT(*) AS total FROM faqs ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM faqs ${whereClause} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  },

  async create(data) {
    const id = generateUUID();
    const now = new Date();
    await pool.query(
      `INSERT INTO faqs (id, question, answer, sort_order, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.question, data.answer, data.sort_order || 0, data.status || 'active', now, now]
    );
    return this.findById(id);
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.question !== undefined) {
      fields.push('question = ?');
      values.push(data.question);
    }
    if (data.answer !== undefined) {
      fields.push('answer = ?');
      values.push(data.answer);
    }
    if (data.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(data.sort_order);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(`UPDATE faqs SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM faqs WHERE id = ?', [id]);
  },
};

module.exports = faqModel;
