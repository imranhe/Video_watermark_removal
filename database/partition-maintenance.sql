-- ============================================================
-- 视频去字幕小程序 - 日志表分区维护脚本
-- 适用数据库: MySQL 5.7+ / 8.0+
-- 使用方式: source /path/to/partition-maintenance.sql
-- ============================================================

USE video_remover;

DELIMITER $$

-- ============================================================
-- 1. 自动创建未来分区的存储过程
--    为指定表创建从当前月起 N 个月的分区
--    用法: CALL create_future_partitions('admin_logs', 3);
-- ============================================================

DROP PROCEDURE IF EXISTS create_future_partitions$$

CREATE PROCEDURE create_future_partitions(
    IN p_table_name VARCHAR(64),
    IN p_months_ahead INT
)
BEGIN
    DECLARE v_month_offset INT DEFAULT 0;
    DECLARE v_partition_name VARCHAR(16);
    DECLARE v_boundary_date VARCHAR(32);
    DECLARE v_boundary_ts BIGINT;
    DECLARE v_sql TEXT;
    DECLARE v_done INT DEFAULT 0;

    -- 如果 p_future 分区不存在，先添加（安全兜底）
    SET @check_sql = CONCAT(
        'SELECT COUNT(*) INTO @cnt FROM INFORMATION_SCHEMA.PARTITIONS ',
        'WHERE TABLE_SCHEMA = DATABASE() ',
        'AND TABLE_NAME = ''', p_table_name, ''' ',
        'AND PARTITION_NAME = ''p_future'''
    );
    PREPARE stmt FROM @check_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    IF @cnt = 0 THEN
        SET v_sql = CONCAT('ALTER TABLE ', p_table_name, ' ADD PARTITION (',
            'PARTITION p_future VALUES LESS THAN MAXVALUE)');
        SET @exec_sql = v_sql;
        PREPARE stmt FROM @exec_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;

    -- 逐月创建分区
    WHILE v_month_offset <= p_months_ahead DO
        -- 计算目标月份的第一天
        SET v_boundary_date = DATE_FORMAT(
            DATE_ADD(LAST_DAY(CURDATE()), INTERVAL (v_month_offset + 1) MONTH) - DAY(LAST_DAY(CURDATE())) + DAY(CURDATE()) - DAY(CURDATE()) + 1 DAY,
            '%Y-%m-01'
        );

        -- 用更简单的方式计算下月 1 日
        SET v_boundary_date = DATE_FORMAT(
            DATE_ADD(
                CONCAT(YEAR(CURDATE()), '-', MONTH(CURDATE()), '-01'),
                INTERVAL v_month_offset MONTH
            ),
            '%Y-%m-01'
        );

        SET v_partition_name = CONCAT('p', DATE_FORMAT(
            CONCAT(YEAR(CURDATE()), '-', MONTH(CURDATE()), '-01'),
            '%Y%m'
        ) + v_month_offset * 1 - v_month_offset * 1);

        -- 重新计算分区名（从当月开始）
        SET v_partition_name = CONCAT('p', DATE_FORMAT(
            DATE_ADD(
                CONCAT(YEAR(CURDATE()), '-', MONTH(CURDATE()), '-01'),
                INTERVAL v_month_offset MONTH
            ),
            '%Y%m'
        ));

        -- 计算边界值：目标月份的下月 1 日
        SET v_boundary_date = DATE_FORMAT(
            DATE_ADD(
                CONCAT(YEAR(CURDATE()), '-', MONTH(CURDATE()), '-01'),
                INTERVAL (v_month_offset + 1) MONTH
            ),
            '%Y-%m-%d 00:00:00'
        );

        SET v_boundary_ts = UNIX_TIMESTAMP(v_boundary_date);

        -- 检查分区是否已存在
        SET @check_sql = CONCAT(
            'SELECT COUNT(*) INTO @cnt FROM INFORMATION_SCHEMA.PARTITIONS ',
            'WHERE TABLE_SCHEMA = DATABASE() ',
            'AND TABLE_NAME = ''', p_table_name, ''' ',
            'AND PARTITION_NAME = ''', v_partition_name, ''''
        );
        PREPARE stmt FROM @check_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        IF @cnt = 0 THEN
            -- 先删除 p_future，再添加新分区和 p_future
            SET v_sql = CONCAT(
                'ALTER TABLE ', p_table_name,
                ' REORGANIZE PARTITION p_future INTO (',
                'PARTITION ', v_partition_name, ' VALUES LESS THAN (', v_boundary_ts, '), ',
                'PARTITION p_future VALUES LESS THAN MAXVALUE)'
            );
            SET @exec_sql = v_sql;
            PREPARE stmt FROM @exec_sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            SELECT CONCAT('Created partition ', v_partition_name,
                ' for table ', p_table_name,
                ' (boundary: ', v_boundary_date, ')') AS result;
        ELSE
            SELECT CONCAT('Partition ', v_partition_name,
                ' already exists for table ', p_table_name, ', skipped') AS result;
        END IF;

        SET v_month_offset = v_month_offset + 1;
    END WHILE;
END$$

-- ============================================================
-- 2. 过期分区清理存储过程
--    删除指定表中超过保留月数的分区
--    用法: CALL cleanup_expired_partitions('admin_logs', 12);
-- ============================================================

DROP PROCEDURE IF EXISTS cleanup_expired_partitions$$

CREATE PROCEDURE cleanup_expired_partitions(
    IN p_table_name VARCHAR(64),
    IN p_retain_months INT
)
BEGIN
    DECLARE v_partition_name VARCHAR(16);
    DECLARE v_boundary_date DATETIME;
    DECLARE v_cutoff_date DATETIME;
    DECLARE v_sql TEXT;
    DECLARE v_dropped_count INT DEFAULT 0;
    DECLARE v_done INT DEFAULT 0;

    -- 计算截止日期
    SET v_cutoff_date = DATE_FORMAT(
        DATE_ADD(CURDATE(), INTERVAL -p_retain_months MONTH),
        '%Y-%m-01'
    );

    -- 遍历需要删除的分区
    DECLARE cur CURSOR FOR
        SELECT PARTITION_NAME, PARTITION_DESCRIPTION
        FROM INFORMATION_SCHEMA.PARTITIONS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table_name
          AND PARTITION_NAME != 'p_future'
          AND PARTITION_DESCRIPTION IS NOT NULL
          AND FROM_UNIXTIME(PARTITION_DESCRIPTION) <= v_cutoff_date
        ORDER BY PARTITION_DESCRIPTION;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_partition_name, @boundary_ts;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- 执行 DROP PARTITION
        SET v_sql = CONCAT('ALTER TABLE ', p_table_name, ' DROP PARTITION ', v_partition_name);
        SET @exec_sql = v_sql;
        PREPARE stmt FROM @exec_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        SET v_dropped_count = v_dropped_count + 1;

        SELECT CONCAT('Dropped partition ', v_partition_name,
            ' from table ', p_table_name) AS result;
    END LOOP;

    CLOSE cur;

    SELECT CONCAT('Total partitions dropped: ', v_dropped_count,
        ' (cutoff: ', v_cutoff_date, ')') AS summary;
END$$

-- ============================================================
-- 3. 分区监控查询（封装为存储过程方便调用）
-- ============================================================

DROP PROCEDURE IF EXISTS show_partition_status$$

CREATE PROCEDURE show_partition_status(
    IN p_table_name VARCHAR(64)
)
BEGIN
    SELECT
        PARTITION_NAME AS partition_name,
        TABLE_ROWS AS estimated_rows,
        ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_size_mb,
        ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS index_size_mb,
        FROM_UNIXTIME(PARTITION_DESCRIPTION) AS boundary_date,
        PARTITION_DESCRIPTION AS boundary_ts
    FROM INFORMATION_SCHEMA.PARTITIONS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND PARTITION_NAME IS NOT NULL
    ORDER BY PARTITION_ORDINAL_POSITION;
END$$

DELIMITER ;

-- ============================================================
-- 4. 独立监控查询（可直接执行，不依赖存储过程）
-- ============================================================

-- 4.1 查看 admin_logs 分区概况
SELECT
    PARTITION_NAME AS '分区名',
    TABLE_ROWS AS '估算行数',
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS '数据大小(MB)',
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS '索引大小(MB)',
    FROM_UNIXTIME(PARTITION_DESCRIPTION) AS '分区边界'
FROM INFORMATION_SCHEMA.PARTITIONS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'admin_logs'
  AND PARTITION_NAME IS NOT NULL
ORDER BY PARTITION_ORDINAL_POSITION;

-- 4.2 查看 usage_logs 分区概况
SELECT
    PARTITION_NAME AS '分区名',
    TABLE_ROWS AS '估算行数',
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS '数据大小(MB)',
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS '索引大小(MB)',
    FROM_UNIXTIME(PARTITION_DESCRIPTION) AS '分区边界'
FROM INFORMATION_SCHEMA.PARTITIONS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'usage_logs'
  AND PARTITION_NAME IS NOT NULL
ORDER BY PARTITION_ORDINAL_POSITION;

-- 4.3 检查 p_future 是否存在（安全兜底分区）
SELECT
    TABLE_NAME AS '表名',
    PARTITION_NAME AS '分区名',
    CASE
        WHEN PARTITION_NAME = 'p_future' THEN '兜底分区存在'
        ELSE '普通分区'
    END AS '状态'
FROM INFORMATION_SCHEMA.PARTITIONS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('admin_logs', 'usage_logs')
  AND PARTITION_NAME = 'p_future';

-- 4.4 即将过期的分区预警（未来 30 天内到达保留期限的分区）
SELECT
    TABLE_NAME AS '表名',
    PARTITION_NAME AS '分区名',
    TABLE_ROWS AS '估算行数',
    FROM_UNIXTIME(PARTITION_DESCRIPTION) AS '边界时间',
    DATEDIFF(FROM_UNIXTIME(PARTITION_DESCRIPTION), CURDATE()) AS '剩余天数'
FROM INFORMATION_SCHEMA.PARTITIONS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('admin_logs', 'usage_logs')
  AND PARTITION_NAME != 'p_future'
  AND PARTITION_DESCRIPTION IS NOT NULL
  AND DATEDIFF(FROM_UNIXTIME(PARTITION_DESCRIPTION), CURDATE()) BETWEEN 0 AND 30
ORDER BY PARTITION_DESCRIPTION;

-- 4.5 验证分区裁剪效果（使用 EXPLAIN）
-- EXPLAIN SELECT * FROM admin_logs
-- WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
--   AND created_at < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH);

-- ============================================================
-- 5. 定时事件调度（可选，需开启 event_scheduler = ON）
-- ============================================================

-- 开启事件调度器（需要 SUPER 权限）
-- SET GLOBAL event_scheduler = ON;

-- 每月 1 日凌晨 3 点自动创建未来 3 个月的分区
DELIMITER $$
DROP EVENT IF EXISTS evt_create_partitions$$

CREATE EVENT evt_create_partitions
ON SCHEDULE EVERY 1 MONTH
STARTS CONCAT(DATE_ADD(LAST_DAY(CURDATE()), INTERVAL 1 DAY), ' 03:00:00')
ON COMPLETION PRESERVE
ENABLE
DO
BEGIN
    CALL create_future_partitions('admin_logs', 3);
    CALL create_future_partitions('usage_logs', 3);
END$$

-- 每月 5 日凌晨 4 点清理过期分区
DROP EVENT IF EXISTS evt_cleanup_partitions$$

CREATE EVENT evt_cleanup_partitions
ON SCHEDULE EVERY 1 MONTH
STARTS CONCAT(DATE_ADD(LAST_DAY(CURDATE()), INTERVAL 5 DAY), ' 04:00:00')
ON COMPLETION PRESERVE
ENABLE
DO
BEGIN
    CALL cleanup_expired_partitions('admin_logs', 12);
    CALL cleanup_expired_partitions('usage_logs', 6);
END$$

DELIMITER ;

-- ============================================================
-- 6. Cron 任务参考（如果不用 MySQL Event Scheduler）
-- ============================================================

-- /etc/cron.d/video-remover-partitions
-- # 每月 1 日 03:00 创建未来分区
-- 0 3 1 * * mysql -u root video_remover -e "CALL create_future_partitions('admin_logs', 3); CALL create_future_partitions('usage_logs', 3);"
-- # 每月 5 日 04:00 清理过期分区
-- 0 4 5 * * mysql -u root video_remover -e "CALL cleanup_expired_partitions('admin_logs', 12); CALL cleanup_expired_partitions('usage_logs', 6);"
