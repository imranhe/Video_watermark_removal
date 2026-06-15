# 软删除使用指南

本文档说明视频去字幕小程序数据库中软删除（Soft Delete）的实现方案和使用规范。

## 软删除原理

软删除不从数据库中物理删除记录，而是通过设置 `deleted_at` 字段标记记录为"已删除"。

**物理删除 vs 软删除：**

| 特性 | 物理删除 | 软删除 |
|------|----------|--------|
| 数据保留 | 永久丢失 | 保留可恢复 |
| 存储空间 | 释放 | 占用 |
| 外键关系 | 级联删除 | 需手动处理 |
| 审计追踪 | 困难 | 容易 |
| 恢复能力 | 不可能 | 直接恢复 |

## 已启用软删除的表

| 表名 | 字段 | 用途 |
|------|------|------|
| tasks | `deleted_at` | 标记任务删除时间 |
| orders | `deleted_at` | 标记订单删除时间 |

## 实现方案

### 软删除标记

```sql
-- 标记删除（将 deleted_at 设为当前时间）
UPDATE tasks
SET deleted_at = NOW()
WHERE id = 'task-id-here' AND deleted_at IS NULL;

UPDATE orders
SET deleted_at = NOW()
WHERE id = 'order-id-here' AND deleted_at IS NULL;
```

### 查询示例

**查询未删除记录（默认行为）：**

```sql
-- 查询所有未删除的任务
SELECT * FROM tasks
WHERE deleted_at IS NULL;

-- 查询用户未删除的任务
SELECT * FROM tasks
WHERE user_id = 'user-id'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

**查询包含已删除记录（管理员审计场景）：**

```sql
-- 查询所有记录（包括已删除）
SELECT * FROM tasks;

-- 查询已删除记录（回收站视图）
SELECT * FROM tasks
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

**区分显示未删除和已删除记录：**

```sql
SELECT
  id,
  status,
  deleted_at,
  CASE
    WHEN deleted_at IS NOT NULL THEN '已删除'
    ELSE '正常'
  END AS record_status
FROM tasks
WHERE user_id = 'user-id';
```

### 聚合查询

```sql
-- 统计用户未删除任务数
SELECT COUNT(*) AS active_task_count
FROM tasks
WHERE user_id = 'user-id'
  AND deleted_at IS NULL;

-- 统计已删除任务数（用于管理报表）
SELECT COUNT(*) AS deleted_task_count
FROM tasks
WHERE user_id = 'user-id'
  AND deleted_at IS NOT NULL;
```

### 关联查询

```sql
-- 查询用户及未删除订单
SELECT
  u.id,
  u.nickname,
  o.id AS order_id,
  o.amount,
  o.status
FROM users u
LEFT JOIN orders o
  ON u.id = o.user_id
  AND o.deleted_at IS NULL
WHERE u.id = 'user-id';
```

## 恢复机制

### 恢复单条记录

```sql
-- 恢复已删除的任务
UPDATE tasks
SET deleted_at = NULL
WHERE id = 'task-id-here'
  AND deleted_at IS NOT NULL;

-- 恢复已删除的订单
UPDATE orders
SET deleted_at = NULL
WHERE id = 'order-id-here'
  AND deleted_at IS NOT NULL;
```

### 批量恢复

```sql
-- 恢复某个用户的所有已删除任务
UPDATE tasks
SET deleted_at = NULL
WHERE user_id = 'user-id'
  AND deleted_at IS NOT NULL;
```

## 清理策略

定期清理长时间软删除的记录以释放存储空间。

### 清理方案

```sql
-- 删除 90 天前软删除的任务及其关联记录
DELETE FROM usage_logs
WHERE task_id IN (
  SELECT id FROM tasks
  WHERE deleted_at IS NOT NULL
    AND deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
);

DELETE FROM tasks
WHERE deleted_at IS NOT NULL
  AND deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 删除 365 天前软删除的订单
DELETE FROM orders
WHERE deleted_at IS NOT NULL
  AND deleted_at < DATE_SUB(NOW(), INTERVAL 365 DAY);
```

### 定期清理建议

| 表名 | 保留期限 | 说明 |
|------|----------|------|
| tasks | 90 天 | 任务数据量大，保留期短 |
| orders | 365 天 | 订单需保留更长时间用于对账 |

建议使用定时任务（如 cron 或 MySQL EVENT）定期执行清理。

### 创建清理事件

```sql
-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 每月 1 日凌晨 3 点清理 90 天前的已删除任务
CREATE EVENT IF NOT EXISTS cleanup_deleted_tasks
ON SCHEDULE EVERY 1 MONTH
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM tasks
  WHERE deleted_at IS NOT NULL
    AND deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 每月 1 日凌晨 4 点清理 365 天前的已删除订单
CREATE EVENT IF NOT EXISTS cleanup_deleted_orders
ON SCHEDULE EVERY 1 MONTH
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM orders
  WHERE deleted_at IS NOT NULL
    AND deleted_at < DATE_SUB(NOW(), INTERVAL 365 DAY);
```

## 应用层集成

### 查询时自动过滤

在应用层查询构建器中，应默认添加 `deleted_at IS NULL` 条件：

```sql
-- 所有常规查询都应包含此条件
WHERE deleted_at IS NULL
```

### 软删除条件唯一索引

如果表中存在唯一索引，软删除可能导致唯一约束冲突。需要将 `deleted_at` 纳入唯一索引：

```sql
-- 示例：如果需要对 openid 做唯一性约束且支持软删除
-- 注意：当前 users 表未使用软删除，此仅为演示
ALTER TABLE users DROP INDEX idx_openid;
ALTER TABLE users ADD UNIQUE INDEX idx_openid_deleted (openid, deleted_at);
```

## 注意事项

1. **外键级联** - 软删除不会触发外键级联，需在应用层手动处理关联数据
2. **唯一约束** - 软删除记录仍占用唯一索引，可能影响新增记录
3. **存储增长** - 需配合定期清理策略控制数据量
4. **备份策略** - 清理前建议归档已删除记录到备份表
5. **查询性能** - `deleted_at IS NULL` 条件已通过 `idx_deleted_at` 索引优化
