# 数据库分区策略

本文档描述视频去字幕小程序日志表的分区设计方案，覆盖 `admin_logs` 和 `usage_logs` 两张高频写入的表。

## 1. 分区策略概述

### 1.1 需要分区的表

| 表名 | 预估日增量 | 保留周期 | 分区方式 |
|------|-----------|---------|---------|
| admin_logs | 500 - 2,000 条 | 12 个月 | RANGE 分区（按月） |
| usage_logs | 5,000 - 50,000 条 | 6 个月 | RANGE 分区（按月） |

### 1.2 为什么选择 RANGE 按月分区

- 日志数据天然按时间单调递增，`created_at` 作为分区键能均匀分布数据。
- 按月粒度兼顾了分区数量可控（一年 12 个）和数据清理便利性（DROP PARTITION 整月）。
- 查询日志时通常附带时间范围条件，分区裁剪能直接跳过无关分区。
- 相比按周或按日分区，按月减少分区元数据开销，适合中小规模业务。

### 1.3 分区要求

MySQL RANGE 分区要求：
- 分区键必须是主键和所有唯一索引的一部分。
- 当前 `admin_logs` 的主键为 `id VARCHAR(36)`，需要将 `created_at` 加入主键和相关唯一约束中。
- 分区表不支持外键约束，需在应用层保证引用完整性。

## 2. admin_logs 表分区方案

### 2.1 分区表定义

```sql
-- 分区版本的 admin_logs 表
CREATE TABLE admin_logs (
    id VARCHAR(36) NOT NULL,
    admin_id VARCHAR(36) NOT NULL COMMENT '操作管理员 ID',
    action VARCHAR(100) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) COMMENT '操作对象类型',
    target_id VARCHAR(36) COMMENT '操作对象 ID',
    detail JSON COMMENT '操作详情',
    ip VARCHAR(45) COMMENT 'IP 地址',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id, created_at),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表（按月分区）'
PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p202501 VALUES LESS THAN (UNIX_TIMESTAMP('2025-02-01 00:00:00')),
    PARTITION p202502 VALUES LESS THAN (UNIX_TIMESTAMP('2025-03-01 00:00:00')),
    PARTITION p202503 VALUES LESS THAN (UNIX_TIMESTAMP('2025-04-01 00:00:00')),
    -- ... 按月依次创建至当前月份 +3
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 2.2 索引设计

| 索引名 | 字段 | 用途 |
|--------|------|------|
| PRIMARY | id, created_at | 主键（必须包含分区键） |
| idx_admin_id | admin_id | 按管理员查询操作记录 |
| idx_action | action | 按操作类型筛选 |
| idx_created_at | created_at | 时间范围查询（配合分区裁剪） |

### 2.3 分区裁剪示例

```sql
-- 查询某月操作日志，MySQL 自动裁剪到对应分区
SELECT * FROM admin_logs
WHERE created_at >= '2025-06-01' AND created_at < '2025-07-01'
  AND admin_id = 'some-admin-id';

-- EXPLAIN 输出应显示 partitions 列仅包含 p202506
```

## 3. usage_logs 表分区方案

### 3.1 分区表定义

```sql
-- 分区版本的 usage_logs 表
CREATE TABLE usage_logs (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL COMMENT '用户 ID',
    task_id VARCHAR(36) NOT NULL COMMENT '任务 ID',
    credit_used INT NOT NULL COMMENT '消费积分',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id, created_at),
    INDEX idx_user_id (user_id),
    INDEX idx_task_id (task_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='使用记录表（按月分区）'
PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p202501 VALUES LESS THAN (UNIX_TIMESTAMP('2025-02-01 00:00:00')),
    PARTITION p202502 VALUES LESS THAN (UNIX_TIMESTAMP('2025-03-01 00:00:00')),
    PARTITION p202503 VALUES LESS THAN (UNIX_TIMESTAMP('2025-04-01 00:00:00')),
    -- ... 按月依次创建至当前月份 +3
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 3.2 索引设计

| 索引名 | 字段 | 用途 |
|--------|------|------|
| PRIMARY | id, created_at | 主键（必须包含分区键） |
| idx_user_id | user_id | 按用户查询使用记录 |
| idx_task_id | task_id | 按任务查询关联记录 |
| idx_created_at | created_at | 时间范围查询（配合分区裁剪） |

## 4. 分区维护脚本

完整维护脚本位于 `database/partition-maintenance.sql`，包含以下功能：

### 4.1 自动创建未来分区

每月初由 cron 或事件调度器调用，提前创建下 3 个月的分区：

```sql
-- 调用示例
CALL create_future_partitions('admin_logs', 3);
CALL create_future_partitions('usage_logs', 3);
```

### 4.2 分区数据清理

按保留策略删除过期分区：

| 表名 | 保留周期 | 清理方式 |
|------|---------|---------|
| admin_logs | 12 个月 | DROP PARTITION |
| usage_logs | 6 个月 | DROP PARTITION |

```sql
-- 调用示例
CALL cleanup_expired_partitions('admin_logs', 12);
CALL cleanup_expired_partitions('usage_logs', 6);
```

### 4.3 分区监控

提供以下监控查询：

- 分区大小与行数统计
- 分区边界与状态检查
- 过期分区预警
- 分区裁剪效果验证

## 5. 数据归档策略

### 5.1 归档流程

```
活跃分区 (0-6月)  -->  近线归档 (6-12月)  -->  离线归档 (>12月)  -->  删除
        |                      |                      |
    在线查询保留          可选：迁移到归档表      导出到对象存储
```

### 5.2 归档方案

**方案一：分区交换（推荐）**

```sql
-- 1. 创建归档表（结构与原表相同，不分区）
CREATE TABLE usage_logs_archive LIKE usage_logs;
ALTER TABLE usage_logs_archive REMOVE PARTITIONING;

-- 2. 将过期分区交换到归档表
ALTER TABLE usage_logs EXCHANGE PARTITION p202406 WITH TABLE usage_logs_archive;

-- 3. 从归档表导出数据
-- mysqldump / SELECT INTO OUTFILE

-- 4. 清空归档表或保留一段时间
TRUNCATE TABLE usage_logs_archive;
```

**方案二：SELECT INTO OUTFILE 直接导出**

```sql
-- 将过期分区数据导出为 CSV
SELECT * FROM usage_logs
WHERE created_at >= '2024-06-01' AND created_at < '2024-07-01'
INTO OUTFILE '/var/lib/mysql-archive/usage_logs_202406.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- 确认导出成功后 DROP PARTITION
ALTER TABLE usage_logs DROP PARTITION p202406;
```

### 5.3 归档存储

- 导出文件存储到对象存储（如阿里云 OSS、AWS S3）。
- 文件命名规范：`{table_name}_{YYYYMM}.csv.gz`。
- 保留周期：根据业务合规要求，通常 3-5 年。
- 如需恢复，通过 `LOAD DATA INFILE` 导入。

## 6. 分区查询优化

### 6.1 查询必须包含分区键

分区表的查询如果不包含 `created_at` 条件，将扫描所有分区，性能反而不如不分区。应确保所有查询都带时间范围：

```sql
-- 好：包含分区键，触发分区裁剪
SELECT * FROM admin_logs
WHERE created_at >= '2025-06-01' AND created_at < '2025-07-01';

-- 差：缺少分区键，扫描全部分区
SELECT * FROM admin_logs WHERE admin_id = 'xxx';
```

### 6.2 应用层改造建议

| 查询场景 | 改造方式 |
|---------|---------|
| 按管理员查日志 | 强制传入时间范围（默认最近 30 天） |
| 按用户查使用记录 | 强制传入时间范围（默认最近 30 天） |
| 日志统计报表 | 按月聚合，每个月只查对应分区 |
| 实时监控 | 只查当前月分区 |

### 6.3 EXPLAIN 验证分区裁剪

```sql
EXPLAIN SELECT * FROM usage_logs
WHERE created_at >= '2025-06-01' AND created_at < '2025-07-01'
  AND user_id = 'some-user-id';

-- 检查 partitions 列，应仅包含 p202506
-- 如果显示多个分区，说明未正确触发裁剪
```

### 6.4 性能对比参考

| 指标 | 不分区（100万行） | 按月分区（12个分区） |
|------|------------------|---------------------|
| 按月查询耗时 | 全表扫描 ~2s | 单分区扫描 ~0.2s |
| 索引维护 | 大 B+Tree，写入变慢 | 小 B+Tree，写入快 |
| 数据清理 | DELETE 大批量，锁表风险 | DROP PARTITION，秒级完成 |
| 存储空间回收 | OPTIMIZE TABLE 才能回收 | DROP PARTITION 立即回收 |

### 6.5 注意事项

1. **分区键选择**：`created_at` 是最佳选择，因为日志查询天然按时间筛选。
2. **唯一约束**：分区后主键必须包含 `created_at`，业务上 `id` 已经是 UUID 不会冲突。
3. **外键**：分区表不支持外键，`admin_logs.admin_id` 和 `usage_logs.user_id/task_id` 的引用完整性由应用层保证。
4. **AUTO_INCREMENT**：当前使用 UUID 作为主键，不依赖 AUTO_INCREMENT，兼容分区。
5. **全局索引 vs 分区索引**：MySQL 分区表的索引是局部索引（per-partition），这对按分区键查询友好，但跨分区的 `ORDER BY` 需要合并排序，应尽量避免。

## 7. 部署检查清单

- [ ] 确认 MySQL 版本 >= 5.7（推荐 8.0+，支持更多分区特性）
- [ ] 确认存储引擎为 InnoDB（支持 RANGE 分区）
- [ ] 备份现有 admin_logs 和 usage_logs 数据
- [ ] 创建分区版本的新表（带 `_partitioned` 后缀）
- [ ] 迁移历史数据到新表
- [ ] 验证数据完整性（行数对比）
- [ ] 重命名表（交换表名）
- [ ] 更新应用层查询，确保包含 `created_at` 条件
- [ ] 部署 cron 任务：每月自动创建未来分区
- [ ] 部署 cron 任务：每月清理过期分区
- [ ] 验证 EXPLAIN 输出确认分区裁剪生效
