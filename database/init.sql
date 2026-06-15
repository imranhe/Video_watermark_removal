-- 视频去字幕小程序数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS video_remover
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE video_remover;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信/支付宝 openid',
    nickname VARCHAR(50) NOT NULL COMMENT '用户昵称',
    avatar_url VARCHAR(500) COMMENT '头像 URL',
    balance INT DEFAULT 0 COMMENT '积分余额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    video_url VARCHAR(500) NOT NULL COMMENT '原始视频 URL',
    result_url VARCHAR(500) COMMENT '处理后视频 URL',
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT '任务状态',
    task_type ENUM('subtitle', 'icon') NOT NULL COMMENT '任务类型',
    progress INT DEFAULT 0 COMMENT '任务进度 (0-100)',
    error_message VARCHAR(500) COMMENT '失败原因',
    params JSON COMMENT '任务参数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    credits INT NOT NULL COMMENT '积分数量',
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
    platform ENUM('wechat', 'alipay') NOT NULL COMMENT '支付平台',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 使用记录表
CREATE TABLE IF NOT EXISTS usage_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    task_id VARCHAR(36) NOT NULL COMMENT '任务 ID',
    credit_used INT NOT NULL COMMENT '消费积分',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_task_id (task_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='使用记录表';

-- 插入示例数据（可选）
-- INSERT INTO users (id, openid, nickname, balance) VALUES
-- ('user-1', 'wx_openid_1', '测试用户', 100);

-- ============================================
-- 后台管理系统表
-- ============================================

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL COMMENT '角色名称',
    permissions JSON COMMENT '权限列表',
    description VARCHAR(200) COMMENT '角色描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '登录用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    name VARCHAR(50) NOT NULL COMMENT '显示名称',
    email VARCHAR(100) COMMENT '邮箱',
    role_id VARCHAR(36) NOT NULL COMMENT '角色 ID',
    status ENUM('active', 'disabled') DEFAULT 'active' COMMENT '账号状态',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role_id (role_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL COMMENT '操作管理员 ID',
    action VARCHAR(100) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) COMMENT '操作对象类型',
    target_id VARCHAR(36) COMMENT '操作对象 ID',
    detail JSON COMMENT '操作详情',
    ip VARCHAR(45) COMMENT 'IP 地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- ============================================
-- 复合索引优化
-- ============================================

-- tasks 表复合索引
ALTER TABLE tasks ADD INDEX idx_user_status (user_id, status);
ALTER TABLE tasks ADD INDEX idx_user_created (user_id, created_at);

-- orders 表复合索引
ALTER TABLE orders ADD INDEX idx_user_created (user_id, created_at);

-- admin_logs 表复合索引
ALTER TABLE admin_logs ADD INDEX idx_admin_created (admin_id, created_at);

-- ============================================
-- 预留字段：软删除和版本控制
-- ============================================

-- tasks 表添加软删除和版本控制
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMP NULL COMMENT '软删除时间';
ALTER TABLE tasks ADD COLUMN version INT DEFAULT 0 COMMENT '乐观锁版本号';

-- orders 表添加软删除和版本控制
ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMP NULL COMMENT '软删除时间';
ALTER TABLE orders ADD COLUMN version INT DEFAULT 0 COMMENT '乐观锁版本号';

-- users 表添加版本控制
ALTER TABLE users ADD COLUMN version INT DEFAULT 0 COMMENT '乐观锁版本号';

-- 软删除索引
ALTER TABLE tasks ADD INDEX idx_deleted_at (deleted_at);
ALTER TABLE orders ADD INDEX idx_deleted_at (deleted_at);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id VARCHAR(36) PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(200) COMMENT '配置说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 公告表
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '公告标题',
    content TEXT NOT NULL COMMENT '公告内容',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft' COMMENT '公告状态',
    published_at TIMESTAMP NULL COMMENT '发布时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告表';

-- FAQ 表
CREATE TABLE IF NOT EXISTS faqs (
    id VARCHAR(36) PRIMARY KEY,
    question VARCHAR(500) NOT NULL COMMENT '问题',
    answer TEXT NOT NULL COMMENT '回答',
    sort_order INT DEFAULT 0 COMMENT '排序权重（升序）',
    status ENUM('active', 'hidden') DEFAULT 'active' COMMENT '显示状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='FAQ 表';
