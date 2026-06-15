-- ============================================
-- 数据库迁移脚本：新增表与字段
-- 基于 API 接口文档 1.0.0
-- ============================================

-- 套餐表
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '套餐名称',
    type ENUM('points', 'monthly', 'quarterly', 'yearly') NOT NULL COMMENT '套餐类型',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    credits INT COMMENT '积分数量（积分套餐）',
    duration_days INT COMMENT '有效期天数（VIP套餐）',
    description VARCHAR(500) COMMENT '套餐描述',
    is_active BOOLEAN DEFAULT true COMMENT '是否上架',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_active (is_active),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='套餐表';

-- 积分记录表（替代原有的 usage_logs）
CREATE TABLE IF NOT EXISTS points_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    task_id VARCHAR(36) COMMENT '关联任务 ID',
    order_id VARCHAR(36) COMMENT '关联订单 ID',
    change_amount INT NOT NULL COMMENT '变动数量（正为增加，负为扣除）',
    balance_after INT NOT NULL COMMENT '变动后余额',
    type ENUM('consume', 'recharge', 'gift', 'refund') NOT NULL COMMENT '变动类型',
    description VARCHAR(200) COMMENT '变动说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_task_id (task_id),
    INDEX idx_order_id (order_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分记录表';

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    type VARCHAR(50) NOT NULL COMMENT '通知类型：task_complete/payment_success/system',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    is_read BOOLEAN DEFAULT false COMMENT '是否已读',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';

-- 反馈表
CREATE TABLE IF NOT EXISTS feedbacks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    type ENUM('bug', 'feature', 'complaint', 'other') NOT NULL COMMENT '反馈类型',
    content TEXT NOT NULL COMMENT '反馈内容',
    contact VARCHAR(100) COMMENT '联系方式',
    status ENUM('pending', 'processing', 'resolved') DEFAULT 'pending' COMMENT '处理状态',
    reply TEXT COMMENT '管理员回复',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='反馈表';

-- ============================================
-- 扩展已有表字段
-- ============================================

-- users 表扩展字段（如果不存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) COMMENT '手机号' AFTER avatar_url;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_type ENUM('none', 'monthly', 'quarterly', 'yearly') DEFAULT 'none' COMMENT 'VIP 类型' AFTER balance;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_expire_at TIMESTAMP NULL COMMENT 'VIP 到期时间' AFTER vip_type;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tasks INT DEFAULT 0 COMMENT '总任务数' AFTER vip_expire_at;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00 COMMENT '总消费金额' AFTER total_tasks;

-- tasks 表扩展字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS points_cost INT DEFAULT 0 COMMENT '消耗积分' AFTER params;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0 COMMENT '重试次数' AFTER points_cost;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0 COMMENT '优先级' AFTER retry_count;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER completed_at;
-- 扩展 task_type 枚举
ALTER TABLE tasks MODIFY COLUMN task_type ENUM('subtitle', 'watermark', 'logo') NOT NULL COMMENT '任务类型';

-- orders 表扩展字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_no VARCHAR(50) UNIQUE COMMENT '订单号' AFTER id;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS package_id VARCHAR(36) COMMENT '套餐 ID' AFTER user_id;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS package_name VARCHAR(100) COMMENT '套餐名称' AFTER package_id;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) COMMENT '支付方式' AFTER status;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_params JSON COMMENT '支付参数' AFTER payment_method;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100) COMMENT '支付平台交易号' AFTER payment_params;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL COMMENT '支付时间' AFTER transaction_id;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER paid_at;
-- 扩展 status 枚举
ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'paid', 'cancelled', 'refunded') DEFAULT 'pending' COMMENT '订单状态';

-- ============================================
-- 种子数据
-- ============================================

-- 插入套餐数据
INSERT IGNORE INTO packages (id, name, type, price, credits, duration_days, description, is_active, sort_order) VALUES
('pkg-1', '100积分', 'points', 9.90, 100, null, '基础套餐', true, 1),
('pkg-2', '500积分', 'points', 39.90, 500, null, '热门套餐', true, 2),
('pkg-3', '1000积分', 'points', 69.90, 1000, null, '超值套餐', true, 3),
('pkg-4', '月卡', 'monthly', 19.90, null, 30, '无限次处理', true, 4),
('pkg-5', '季卡', 'quarterly', 49.90, null, 90, '无限次+优先', true, 5),
('pkg-6', '年卡', 'yearly', 169.90, null, 365, '无限次+优先+高清', true, 6);

-- 插入系统配置
INSERT IGNORE INTO system_configs (id, config_key, config_value, description) VALUES
('cfg-1', 'free_trial_credits', '30', '新用户赠送积分'),
('cfg-2', 'max_video_duration', '300', '视频最大时长（秒）'),
('cfg-3', 'max_video_size', '100', '视频最大大小（MB）'),
('cfg-4', 'task_timeout', '600', '任务超时时间（秒）'),
('cfg-5', 'retry_count', '3', '最大重试次数'),
('cfg-6', 'vip_priority', 'true', 'VIP 优先处理'),
('cfg-7', 'content_check', 'true', '内容审核开关'),
('cfg-8', 'maintenance_mode', 'false', '维护模式');
