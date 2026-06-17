const pool = require('../config/database');
const { generateUUID } = require('../utils/helpers');

const adminModel = {
  async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM admins WHERE id = ? AND status = ? LIMIT 1', [id, 'active']);
    return rows[0] || null;
  },

  async create(data) {
    const id = generateUUID();
    const now = new Date();
    await pool.query(
      `INSERT INTO admins (id, username, password_hash, name, email, role_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.username, data.password_hash, data.name, data.email || null, data.role_id, 'active', now, now]
    );
    return this.findById(id);
  },

  async updateLastLogin(id) {
    await pool.query('UPDATE admins SET last_login_at = NOW() WHERE id = ?', [id]);
  },
};

module.exports = adminModel;
