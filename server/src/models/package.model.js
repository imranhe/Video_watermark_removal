const pool = require('../config/database');

const packageModel = {
  async findAll(activeOnly = true) {
    const query = activeOnly
      ? 'SELECT * FROM packages WHERE is_active = true ORDER BY sort_order ASC'
      : 'SELECT * FROM packages ORDER BY sort_order ASC';
    const [rows] = await pool.query(query);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM packages WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },
};

module.exports = packageModel;
