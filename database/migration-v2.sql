-- ============================================
-- 数据库迁移脚本：v1 -> v2
-- 将旧版 init.sql 创建的数据库升级到新版本
-- 执行前请先备份数据库！
--
-- 用法：mysql -u root -p video_remover < migration-v2.sql
-- ============================================

USE video_remover;

-- -----------------------------------------------
-- 辅助存储过程：安全添加列（如果不存在）
-- -----------------------------------------------
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_def TEXT,
    IN p_after_column VARCHAR(64)
)
BEGIN
    DECLARE col_count INT DEFAULT 0;

    SELECT COUNT(*) INTO col_count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name;

    IF col_count = 0 THEN
        IF p_after_column IS NULL OR p_after_column = '' THEN
            SET @sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_column_def);
        ELSE
            SET @sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_column_def, ' AFTER `', p_after_column, '`');
        END IF;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- -----------------------------------------------
-- 辅助存储过程：安全添加索引（如果不存在）
-- -----------------------------------------------
DROP PROCEDURE IF EXISTS add_index_if_not_exists;

DELIMITER //
CREATE PROCEDURE add_index_if_not_exists(
    IN p_table_name VARCHAR(64),
    IN p_index_name VARCHAR(64),
    IN p_index_def TEXT
)
BEGIN
    DECLARE idx_count INT DEFAULT 0;

    SELECT COUNT(*) INTO idx_count
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name;

    IF idx_count = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD INDEX `', p_index_name, '` (', p_index_def, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- ============================================
-- 一、升级 users 表
-- ============================================

-- 旧表缺失字段：phone, vip_type, vip_expire_at, total_tasks, total_spent, status, version
-- 注：旧版 init.sql 末尾已添加 version，此过程会自动跳过

CALL add_column_if_not_exists('users', 'phone',
    "VARCHAR(20) DEFAULT NULL COMMENT '手机号'", 'avatar_url');

CALL add_column_if_not_exists('users', 'vip_type',
    "ENUM('none','monthly','yearly') DEFAULT 'none' COMMENT 'VIP 类型'", 'phone');

CALL add_column_if_not_exists('users', 'vip_expire_at',
    "TIMESTAMP NULL DEFAULT NULL COMMENT 'VIP 到期时间'", 'vip_type');

CALL add_column_if_not_exists('users', 'total_tasks',
    "INT DEFAULT 0 COMMENT '累计任务数'", 'vip_expire_at');

CALL add_column_if_not_exists('users', 'total_spent',
    "INT DEFAULT 0 COMMENT '累计消费积分'", 'total_tasks');

CALL add_column_if_not_exists('users', 'status',
    "ENUM('active','banned') DEFAULT 'active' COMMENT '账号状态'", 'total_spent');

CALL add_column_if_not_exists('users', 'version',
    "INT DEFAULT 0 COMMENT '乐观锁版本号'", 'status');

-- ============================================
-- 二、升级 tasks 表
-- ============================================

-- 旧表缺失字段：points_cost, retry_count, priority, duration, updated_at
-- 旧表 task_type ENUM 只有 'subtitle','icon'，需要添加 'watermark','logo'
-- 旧表 status ENUM 缺少 'cancelled'

-- 2.1 添加新列

CALL add_column_if_not_exists('tasks', 'points_cost',
    "INT DEFAULT 10 COMMENT '消费积分数'", 'params');

CALL add_column_if_not_exists('tasks', 'retry_count',
    "INT DEFAULT 0 COMMENT '重试次数'", 'points_cost');

CALL add_column_if_not_exists('tasks', 'priority',
    "INT DEFAULT 0 COMMENT '优先级（数值越大越优先）'", 'retry_count');

CALL add_column_if_not_exists('tasks', 'duration',
    "INT DEFAULT NULL COMMENT '视频时长（秒）'", 'priority');

CALL add_column_if_not_exists('tasks', 'updated_at',
    "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'", 'completed_at');

CALL add_column_if_not_exists('tasks', 'deleted_at',
    "TIMESTAMP NULL DEFAULT NULL COMMENT '软删除时间'", 'updated_at');

CALL add_column_if_not_exists('tasks', 'version',
    "INT DEFAULT 0 COMMENT '乐观锁版本号'", 'deleted_at');

-- 2.2 修改 task_type ENUM：添加 'watermark' 和 'logo'
-- 注意：ALTER COLUMN 修改 ENUM 值必须指定完整列表

ALTER TABLE tasks MODIFY COLUMN task_type
    ENUM('subtitle','icon','watermark','logo') NOT NULL COMMENT '任务类型';

-- 2.3 修改 status ENUM：添加 'cancelled'

ALTER TABLE tasks MODIFY COLUMN status
    ENUM('pending','processing','completed','failed','cancelled') DEFAULT 'pending' COMMENT '任务状态';

-- 2.4 添加缺失索引

CALL add_index_if_not_exists('tasks', 'idx_updated_at', 'updated_at');
CALL add_index_if_not_exists('tasks', 'idx_deleted_at', 'deleted_at');

-- ============================================
-- 三、升级 orders 表
-- ============================================

-- 旧表缺失字段：order_no, package_id, package_name, payment_method,
--               payment_params, transaction_id, paid_at, deleted_at, version
-- 旧表有 'platform' 列（ENUM），新表使用 'payment_method'（VARCHAR）
-- 旧表 status ENUM 缺少 'failed','refunded'

-- 3.1 添加新列

CALL add_column_if_not_exists('orders', 'order_no',
    "VARCHAR(32) UNIQUE DEFAULT NULL COMMENT '订单编号'", 'id');

CALL add_column_if_not_exists('orders', 'package_id',
    "VARCHAR(36) DEFAULT NULL COMMENT '套餐 ID'", 'user_id');

CALL add_column_if_not_exists('orders', 'package_name',
    "VARCHAR(100) DEFAULT NULL COMMENT '套餐名称'", 'package_id');

CALL add_column_if_not_exists('orders', 'payment_method',
    "VARCHAR(32) DEFAULT NULL COMMENT '支付方式（wechat/alipay）'", 'status');

CALL add_column_if_not_exists('orders', 'payment_params',
    "JSON DEFAULT NULL COMMENT '支付参数（JSON）'", 'payment_method');

CALL add_column_if_not_exists('orders', 'transaction_id',
    "VARCHAR(100) DEFAULT NULL COMMENT '第三方交易流水号'", 'payment_params');

CALL add_column_if_not_exists('orders', 'paid_at',
    "TIMESTAMP NULL DEFAULT NULL COMMENT '支付时间'", 'transaction_id');

CALL add_column_if_not_exists('orders', 'updated_at',
    "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'", 'created_at');

CALL add_column_if_not_exists('orders', 'deleted_at',
    "TIMESTAMP NULL DEFAULT NULL COMMENT '软删除时间'", 'updated_at');

CALL add_column_if_not_exists('orders', 'version',
    "INT DEFAULT 0 COMMENT '乐观锁版本号'", 'deleted_at');

-- 3.2 迁移 platform 列数据到 payment_method（如果 payment_method 为空）

UPDATE orders
SET payment_method = platform
WHERE payment_method IS NULL AND platform IS NOT NULL;

-- 3.3 删除旧的 platform ENUM 列
-- 注意：MySQL 不支持 DROP COLUMN IF EXISTS，需要先检查

-- 3.4 修改 status ENUM：添加 'failed' 和 'refunded'

ALTER TABLE orders MODIFY COLUMN status
    ENUM('pending','paid','cancelled','failed','refunded') DEFAULT 'pending' COMMENT '订单状态';

-- 3.5 添加缺失索引

CALL add_index_if_not_exists('orders', 'idx_order_no', 'order_no');
CALL add_index_if_not_exists('orders', 'idx_updated_at', 'updated_at');
CALL add_index_if_not_exists('orders', 'idx_deleted_at', 'deleted_at');

-- ============================================
-- 四、创建 packages 表（新增）
-- ============================================

CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '套餐名称',
    points INT NOT NULL COMMENT '包含积分数',
    price DECIMAL(10,2) NOT NULL COMMENT '价格（元）',
    original_price DECIMAL(10,2) DEFAULT NULL COMMENT '原价（划线价）',
    description VARCHAR(500) DEFAULT NULL COMMENT '套餐描述',
    badge VARCHAR(50) DEFAULT NULL COMMENT '角标文案（如 "热销"、"限时优惠"）',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否上架',
    sort_order INT DEFAULT 0 COMMENT '排序权重（升序）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分套餐表';

-- ============================================
-- 五、创建 points_logs 表（新增）
-- ============================================

CREATE TABLE IF NOT EXISTS points_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    task_id VARCHAR(36) DEFAULT NULL COMMENT '关联任务 ID',
    order_id VARCHAR(36) DEFAULT NULL COMMENT '关联订单 ID',
    change_amount INT NOT NULL COMMENT '变动数量（正数为充值，负数为消费）',
    balance_after INT NOT NULL COMMENT '变动后余额',
    type VARCHAR(32) NOT NULL COMMENT '变动类型（recharge/consume/gift/refund 等）',
    description VARCHAR(200) DEFAULT NULL COMMENT '变动描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分变动日志表';

-- ============================================
-- 六、创建 notifications 表（新增）
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    type VARCHAR(32) NOT NULL COMMENT '通知类型（system/order/task 等）',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    is_read TINYINT(1) DEFAULT 0 COMMENT '是否已读',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户通知表';

-- ============================================
-- 七、创建 feedbacks 表（新增）
-- ============================================

CREATE TABLE IF NOT EXISTS feedbacks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    type VARCHAR(32) NOT NULL COMMENT '反馈类型（bug/suggestion/other）',
    content TEXT NOT NULL COMMENT '反馈内容',
    contact VARCHAR(100) DEFAULT NULL COMMENT '联系方式',
    status ENUM('pending','replied','closed') DEFAULT 'pending' COMMENT '处理状态',
    reply TEXT DEFAULT NULL COMMENT '管理员回复',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表';

-- ============================================
-- 八、清理辅助存储过程
-- ============================================

DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DROP PROCEDURE IF EXISTS add_index_if_not_exists;

-- ============================================
-- 迁移完成
-- ============================================
SELECT 'Migration v1 -> v2 完成' AS migration_status;
