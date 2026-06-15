const pool = require('../config/database');
const { generateUUID, generateOrderNo } = require('../utils/helpers');

const orderModel = {
  async create(data) {
    const id = generateUUID();
    const orderNo = generateOrderNo();
    const now = new Date();
    await pool.query(
      `INSERT INTO orders (id, order_no, user_id, package_id, package_name, amount, credits, status, payment_method, payment_params, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        orderNo,
        data.user_id,
        data.package_id,
        data.package_name,
        data.amount,
        data.credits,
        data.status || 'pending',
        data.payment_method,
        data.payment_params ? JSON.stringify(data.payment_params) : null,
        now,
        now,
      ]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByOrderNo(orderNo) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE order_no = ? LIMIT 1', [orderNo]);
    return rows[0] || null;
  },

  async findByUser(userId, options = {}) {
    const { page = 1, pageSize = 20, offset = 0, status } = options;
    const conditions = ['user_id = ?', 'deleted_at IS NULL'];
    const values = [userId];

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }

    const whereClause = conditions.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders WHERE ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.transaction_id !== undefined) {
      fields.push('transaction_id = ?');
      values.push(data.transaction_id);
    }
    if (data.paid_at !== undefined) {
      fields.push('paid_at = ?');
      values.push(data.paid_at);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    fields.push('version = version + 1');
    values.push(id);

    await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async markPaid(id, transactionId) {
    const now = new Date();
    await pool.query(
      `UPDATE orders SET status = 'paid', transaction_id = ?, paid_at = ?, updated_at = NOW(), version = version + 1
       WHERE id = ? AND status = 'pending'`,
      [transactionId, now, id]
    );
  },

  async getStats() {
    const [rows] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue,
        COUNT(*) AS total_orders,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_orders
      FROM orders WHERE deleted_at IS NULL
    `);
    return rows[0];
  },

  async getTodayStats() {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue
      FROM orders
      WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL
    `);
    return rows[0];
  },
};

module.exports = orderModel;
