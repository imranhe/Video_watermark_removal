const adminService = require('../services/admin.service');
const { successResponse, paginate } = require('../utils/helpers');

const adminController = {
  // ===== 登录（无需认证） =====
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const ip = req.ip || req.connection?.remoteAddress || '';
      const result = await adminService.login(username, password, ip);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  // ===== 仪表盘 =====
  async getTodayStats(req, res, next) {
    try {
      const result = await adminService.getTodayStats();
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  // ===== 用户管理 =====
  async getUsers(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await adminService.getUsers({
        page,
        pageSize,
        offset,
        status: query.status,
        vip_type: query.vip_type,
        search: query.search,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async getUserDetail(req, res, next) {
    try {
      const result = await adminService.getUserDetail(req.params.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const { status } = req.body;
      const result = await adminService.updateUserStatus(
        req.params.id,
        status,
        req.user.id,
        req.ip
      );
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async adjustUserBalance(req, res, next) {
    try {
      const { amount, description } = req.body;
      const result = await adminService.adjustUserBalance(
        req.params.id,
        amount,
        description,
        req.user.id,
        req.ip
      );
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  // ===== 任务管理 =====
  async getTasks(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await adminService.getTasks({
        page,
        pageSize,
        offset,
        status: query.status,
        task_type: query.task_type,
        user_id: query.user_id,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async getTaskDetail(req, res, next) {
    try {
      const result = await adminService.getTaskDetail(req.params.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async updateTaskStatus(req, res, next) {
    try {
      const { status } = req.body;
      const result = await adminService.updateTaskStatus(
        req.params.id,
        status,
        req.user.id,
        req.ip
      );
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  // ===== 订单管理 =====
  async getOrders(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await adminService.getOrders({
        page,
        pageSize,
        offset,
        status: query.status,
        payment_method: query.payment_method,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async refundOrder(req, res, next) {
    try {
      const { reason } = req.body;
      const result = await adminService.refundOrder(
        req.params.id,
        reason,
        req.user.id,
        req.ip
      );
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  // ===== 公告管理 =====
  async getAnnouncements(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await adminService.getAnnouncements({
        page,
        pageSize,
        offset,
        status: query.status,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async createAnnouncement(req, res, next) {
    try {
      const result = await adminService.createAnnouncement(req.body);
      res.status(201).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async updateAnnouncement(req, res, next) {
    try {
      const result = await adminService.updateAnnouncement(req.params.id, req.body);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async deleteAnnouncement(req, res, next) {
    try {
      await adminService.deleteAnnouncement(req.params.id);
      res.json(successResponse(null, '删除成功'));
    } catch (err) {
      next(err);
    }
  },

  // ===== FAQ 管理 =====
  async getFaqs(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await adminService.getFaqs({
        page,
        pageSize,
        offset,
        status: query.status,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async createFaq(req, res, next) {
    try {
      const result = await adminService.createFaq(req.body);
      res.status(201).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async updateFaq(req, res, next) {
    try {
      const result = await adminService.updateFaq(req.params.id, req.body);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async deleteFaq(req, res, next) {
    try {
      await adminService.deleteFaq(req.params.id);
      res.json(successResponse(null, '删除成功'));
    } catch (err) {
      next(err);
    }
  },

  // ===== 反馈管理 =====
  async getFeedbacks(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await adminService.getFeedbacks({
        page,
        pageSize,
        offset,
        status: query.status,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async updateFeedback(req, res, next) {
    try {
      const result = await adminService.updateFeedback(
        req.params.id,
        req.body,
        req.user.id,
        req.ip
      );
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  // ===== 系统配置 =====
  async getSystemConfigs(req, res, next) {
    try {
      const result = await adminService.getSystemConfigs();
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async updateSystemConfig(req, res, next) {
    try {
      const { config_value, description } = req.body;
      const result = await adminService.updateSystemConfig(
        req.params.key,
        config_value,
        req.user.id,
        req.ip
      );
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  // ===== 操作日志 =====
  async getAdminLogs(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await adminService.getAdminLogs({
        page,
        pageSize,
        offset,
        action: query.action,
        target_type: query.target_type,
        admin_id: query.admin_id,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
