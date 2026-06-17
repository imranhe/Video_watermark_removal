-- 视频去字幕小程序数据库初始化脚本
-- 完整数据库结构定义

-- 创建数据库
CREATE DATABASE IF NOT EXISTS video_remover
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE video_remover;

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY COMMENT '用户 ID',
    openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信/支付宝 openid',
    nickname VARCHAR(50) DEFAULT '' COMMENT '用户昵称',
    avatar_url VARCHAR(500) COMMENT '头像 URL',
    phone VARCHAR(20) COMMENT '手机号',
    balance INT DEFAULT 30 COMMENT '积分余额',
    vip_type ENUM('none', 'monthly', 'quarterly', 'yearly') DEFAULT 'none' COMMENT 'VIP 类型',
    vip_expire_at TIMESTAMP NULL COMMENT 'VIP 到期时间',
    total_tasks INT DEFAULT 0 COMMENT '累计任务数',
    total_spent INT DEFAULT 0 COMMENT '累计消费积分',
    status ENUM('active', 'banned') DEFAULT 'active' COMMENT '账号状态',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_openid (openid),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================
-- 任务表
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY COMMENT '任务 ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    video_url VARCHAR(500) NOT NULL COMMENT '原始视频 URL',
    result_url VARCHAR(500) COMMENT '处理后视频 URL',
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '任务状态',
    task_type ENUM('subtitle', 'watermark', 'logo') NOT NULL COMMENT '任务类型',
    progress INT DEFAULT 0 COMMENT '任务进度 (0-100)',
    error_message VARCHAR(500) COMMENT '失败原因',
    params JSON COMMENT '任务参数',
    points_cost INT DEFAULT 10 COMMENT '消耗积分数',
    retry_count INT DEFAULT 0 COMMENT '重试次数',
    priority INT DEFAULT 0 COMMENT '优先级',
    duration INT DEFAULT 0 COMMENT '视频时长（秒）',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    deleted_at TIMESTAMP NULL COMMENT '软删除时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_created (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务表';

-- ============================================
-- 订单表
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY COMMENT '订单 ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单编号',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    credits INT NOT NULL COMMENT '积分数量',
    status ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
    package_id VARCHAR(36) COMMENT '套餐 ID',
    package_name VARCHAR(100) COMMENT '套餐名称',
    payment_method VARCHAR(20) COMMENT '支付方式',
    payment_params JSON COMMENT '支付参数',
    transaction_id VARCHAR(100) COMMENT '第三方交易号',
    paid_at TIMESTAMP NULL COMMENT '支付时间',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    deleted_at TIMESTAMP NULL COMMENT '软删除时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_order_no (order_no),
    INDEX idx_user_created (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ============================================
-- 套餐表
-- ============================================
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(36) PRIMARY KEY COMMENT '套餐 ID',
    name VARCHAR(100) NOT NULL COMMENT '套餐名称',
    type ENUM('credits', 'vip') NOT NULL COMMENT '套餐类型',
    credits INT DEFAULT 0 COMMENT '积分数量',
    price DECIMAL(10,2) NOT NULL COMMENT '价格（元）',
    duration_days INT DEFAULT 0 COMMENT '有效天数（VIP 套餐）',
    description TEXT COMMENT '套餐描述',
    is_active BOOLEAN DEFAULT true COMMENT '是否上架',
    sort_order INT DEFAULT 0 COMMENT '排序权重（升序）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='套餐表';

-- ============================================
-- 积分变动记录表
-- ============================================
CREATE TABLE IF NOT EXISTS points_logs (
    id VARCHAR(36) PRIMARY KEY COMMENT '记录 ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    type ENUM('consume', 'recharge', 'gift', 'refund') NOT NULL COMMENT '变动类型',
    change_amount INT NOT NULL COMMENT '变动数量（正数增加，负数减少）',
    balance_after INT NOT NULL COMMENT '变动后余额',
    task_id VARCHAR(36) COMMENT '关联任务 ID',
    order_id VARCHAR(36) COMMENT '关联订单 ID',
    description VARCHAR(500) COMMENT '变动说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分变动记录表';

-- ============================================
-- 通知表
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY COMMENT '通知 ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    type ENUM('task_complete', 'payment_success', 'system') NOT NULL COMMENT '通知类型',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    is_read BOOLEAN DEFAULT false COMMENT '是否已读',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';

-- ============================================
-- 反馈表
-- ============================================
CREATE TABLE IF NOT EXISTS feedbacks (
    id VARCHAR(36) PRIMARY KEY COMMENT '反馈 ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    type ENUM('bug', 'feature', 'complaint', 'other') NOT NULL COMMENT '反馈类型',
    content TEXT NOT NULL COMMENT '反馈内容',
    contact VARCHAR(100) COMMENT '联系方式',
    status ENUM('pending', 'processing', 'resolved') DEFAULT 'pending' COMMENT '处理状态',
    reply TEXT COMMENT '管理员回复',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='反馈表';

-- ============================================
-- 角色表
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY COMMENT '角色 ID',
    name VARCHAR(50) UNIQUE NOT NULL COMMENT '角色名称',
    permissions JSON COMMENT '权限列表',
    description VARCHAR(200) COMMENT '角色描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- ============================================
-- 管理员表
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(36) PRIMARY KEY COMMENT '管理员 ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '登录用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    name VARCHAR(50) NOT NULL COMMENT '显示名称',
    email VARCHAR(100) COMMENT '邮箱',
    role_id VARCHAR(36) NOT NULL COMMENT '角色 ID',
    status ENUM('active', 'disabled') DEFAULT 'active' COMMENT '账号状态',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_role_id (role_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- ============================================
-- 操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id VARCHAR(36) PRIMARY KEY COMMENT '日志 ID',
    admin_id VARCHAR(36) NOT NULL COMMENT '操作管理员 ID',
    action VARCHAR(100) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) COMMENT '操作对象类型',
    target_id VARCHAR(36) COMMENT '操作对象 ID',
    detail JSON COMMENT '操作详情',
    ip VARCHAR(45) COMMENT 'IP 地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_admin_created (admin_id, created_at),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- ============================================
-- 公告表
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(36) PRIMARY KEY COMMENT '公告 ID',
    title VARCHAR(200) NOT NULL COMMENT '公告标题',
    content TEXT NOT NULL COMMENT '公告内容',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft' COMMENT '公告状态',
    published_at TIMESTAMP NULL COMMENT '发布时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告表';

-- ============================================
-- FAQ 表
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
    id VARCHAR(36) PRIMARY KEY COMMENT 'FAQ ID',
    question VARCHAR(500) NOT NULL COMMENT '问题',
    answer TEXT NOT NULL COMMENT '回答',
    sort_order INT DEFAULT 0 COMMENT '排序权重（升序）',
    status ENUM('active', 'hidden') DEFAULT 'active' COMMENT '显示状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='FAQ 表';

-- ============================================
-- 系统配置表
-- ============================================
CREATE TABLE IF NOT EXISTS system_configs (
    id VARCHAR(36) PRIMARY KEY COMMENT '配置 ID',
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(200) COMMENT '配置说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- ============================================
-- 默认数据
-- ============================================

-- 默认管理员角色
INSERT INTO roles (id, name, permissions, description) VALUES
('role-admin', '超级管理员', '["*"]', '拥有所有权限');

-- 默认管理员账号（密码哈希为占位符，部署时需替换为真实哈希）
INSERT INTO admins (id, username, password_hash, name, role_id, status) VALUES
('admin-1', 'admin', '$2a$10$placeholder', '系统管理员', 'role-admin', 'active');
