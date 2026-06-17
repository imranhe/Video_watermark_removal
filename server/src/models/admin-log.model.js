const pool = require('../config/database');
const { generateUUID } = require('../utils/helpers');

const adminLogModel = {
  async create(data) {
    const id = generateUUID();
    await pool.query(
      `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, detail, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, data.admin_id, data.action, data.target_type || null, data.target_id || null, data.detail ? JSON.stringify(data.detail) : null, data.ip || null]
    );
    return { id, ...data };
  },

  async findByAdmin(adminId, options = {}) {
    const { page = 1, pageSize = 20, offset = 0, action, target_type } = options;
    const conditions = ['admin_id = ?'];
    const values = [adminId];

    if (action) {
      conditions.push('action = ?');
      values.push(action);
    }
    if (target_type) {
      conditions.push('target_type = ?');
      values.push(target_type);
    }

    const whereClause = conditions.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM admin_logs WHERE ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM admin_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  },

  async findAll(options = {}) {
    const { page = 1, pageSize = 20, offset = 0, action, target_type, admin_id } = options;
    const conditions = [];
    const values = [];

    if (admin_id) {
      conditions.push('admin_id = ?');
      values.push(admin_id);
    }
    if (action) {
      conditions.push('action = ?');
      values.push(action);
    }
    if (target_type) {
      conditions.push('target_type = ?');
      values.push(target_type);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM admin_logs ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM admin_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  },
};

module.exports = adminLogModel;
