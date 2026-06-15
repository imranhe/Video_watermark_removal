const userModel = require('../models/user.model');

const userService = {
  async getUserInfo(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 1002;
      throw error;
    }

    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      phone: user.phone || null,
      balance: user.balance,
      vip_type: user.vip_type || 'none',
      vip_expire_at: user.vip_expire_at || null,
      total_tasks: user.total_tasks || 0,
      total_spent: user.total_spent || 0,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  },

  async updateUser(userId, data) {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 1002;
      throw error;
    }

    const updatedUser = await userModel.update(userId, {
      nickname: data.nickname,
      avatar_url: data.avatar_url,
      phone: data.phone,
    });

    return {
      id: updatedUser.id,
      nickname: updatedUser.nickname,
      avatar_url: updatedUser.avatar_url,
      phone: updatedUser.phone || null,
      updated_at: updatedUser.updated_at,
    };
  },

  async getUserStats(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 1002;
      throw error;
    }

    const stats = await userModel.getStats(userId);
    return {
      total_tasks: stats?.total_tasks || 0,
      completed_tasks: stats?.completed_tasks || 0,
      failed_tasks: stats?.failed_tasks || 0,
      total_points_used: Math.abs(parseInt(stats?.total_points_used || '0')),
      total_points_recharged: parseInt(stats?.total_points_recharged || '0'),
      current_balance: stats?.balance || 0,
      vip_type: stats?.vip_type || 'none',
      vip_expire_at: stats?.vip_expire_at || null,
    };
  },
};

module.exports = userService;
