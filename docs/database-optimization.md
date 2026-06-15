# 数据库索引优化文档

本文档记录视频去字幕小程序数据库的索引优化方案，包含新增的复合索引设计、使用场景和性能分析。

---

## 1. 优化的索引列表

### 1.1 tasks 表复合索引

| 索引名称 | 列组合 | 索引类型 | 说明 |
|----------|--------|----------|------|
| idx_user_status | (user_id, status) | 复合 B-Tree | 用户维度按状态筛选任务 |
| idx_user_created | (user_id, created_at) | 复合 B-Tree | 用户维度按时间排序任务 |

### 1.2 orders 表复合索引

| 索引名称 | 列组合 | 索引类型 | 说明 |
|----------|--------|----------|------|
| idx_user_created | (user_id, created_at) | 复合 B-Tree | 用户维度按时间排序订单 |

### 1.3 admin_logs 表复合索引

| 索引名称 | 列组合 | 索引类型 | 说明 |
|----------|--------|----------|------|
| idx_admin_created | (admin_id, created_at) | 复合 B-Tree | 管理员维度按时间排序操作日志 |

---

## 2. 每个索引的使用场景

### 2.1 idx_user_status (tasks)

**适用场景：**
- 用户查看自己的任务列表，按状态分组筛选（如"进行中"、"已完成"）
- 用户统计各状态任务数量
- 后台按用户+状态维度查询任务

**典型查询模式：**
```sql
-- 用户查看特定状态的任务
SELECT * FROM tasks
WHERE user_id = 'xxx' AND status = 'completed'
ORDER BY created_at DESC
LIMIT 20;

-- 用户统计各状态任务数
SELECT status, COUNT(*) as count
FROM tasks
WHERE user_id = 'xxx'
GROUP BY status;

-- 后台查询某用户的待处理任务
SELECT * FROM tasks
WHERE user_id = 'xxx' AND status IN ('pending', 'processing');
```

### 2.2 idx_user_created (tasks)

**适用场景：**
- 用户查看任务列表，默认按时间倒序排列
- 用户分页浏览历史任务
- 查询用户最近创建的任务

**典型查询模式：**
```sql
-- 用户任务列表（分页）
SELECT * FROM tasks
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- 查询用户最近N天的任务
SELECT * FROM tasks
WHERE user_id = 'xxx'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;

-- 查询用户最新一条任务
SELECT * FROM tasks
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 1;
```

### 2.3 idx_user_created (orders)

**适用场景：**
- 用户查看订单列表，按时间倒序排列
- 用户分页浏览历史订单
- 查询用户最近的支付记录

**典型查询模式：**
```sql
-- 用户订单列表（分页）
SELECT * FROM orders
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- 查询用户最近30天的订单
SELECT * FROM orders
WHERE user_id = 'xxx'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC;

-- 用户消费统计（按月）
SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
       SUM(amount) as total_amount,
       COUNT(*) as order_count
FROM orders
WHERE user_id = 'xxx' AND status = 'paid'
GROUP BY month
ORDER BY month DESC;
```

### 2.4 idx_admin_created (admin_logs)

**适用场景：**
- 后台查看某管理员的操作日志
- 审计特定管理员的操作历史
- 按管理员维度分析操作频率

**典型查询模式：**
```sql
-- 查看某管理员的操作日志（分页）
SELECT * FROM admin_logs
WHERE admin_id = 'xxx'
ORDER BY created_at DESC
LIMIT 50 OFFSET 0;

-- 查询某管理员最近24小时的操作
SELECT * FROM admin_logs
WHERE admin_id = 'xxx'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY created_at DESC;

-- 统计各管理员今日操作次数
SELECT admin_id, COUNT(*) as action_count
FROM admin_logs
WHERE created_at >= CURDATE()
GROUP BY admin_id
ORDER BY action_count DESC;
```

---

## 3. 查询优化示例

### 3.1 优化前：仅使用单列索引

```sql
-- 查询用户已完成的任务
-- 优化前：使用 idx_user_id 单列索引，需要回表后再过滤 status
SELECT * FROM tasks
WHERE user_id = 'user-123' AND status = 'completed'
ORDER BY created_at DESC;

-- EXPLAIN 输出（优化前）：
-- type: ref, key: idx_user_id, rows: ~500, Extra: Using where; Using filesort
-- 需要扫描该用户所有任务，再过滤状态，最后排序
```

### 3.2 优化后：使用复合索引

```sql
-- 同样的查询，使用复合索引
-- 优化后：使用 idx_user_status 复合索引，索引直接定位
SELECT * FROM tasks
WHERE user_id = 'user-123' AND status = 'completed'
ORDER BY created_at DESC;

-- EXPLAIN 输出（优化后）：
-- type: ref, key: idx_user_status, rows: ~50, Extra: Using where
-- 直接通过索引定位到用户+状态组合，大幅减少扫描行数
```

### 3.3 覆盖索引优化

```sql
-- 统计用户各状态任务数量（可利用覆盖索引）
SELECT status, COUNT(*) as count
FROM tasks
WHERE user_id = 'user-123'
GROUP BY status;

-- idx_user_status 索引包含查询所需的全部列，
-- MySQL 可直接从索引中获取数据，无需回表
```

---

## 4. 性能对比

### 4.1 tasks 表查询性能对比

| 查询场景 | 优化前（单列索引） | 优化后（复合索引） | 提升幅度 |
|----------|-------------------|-------------------|----------|
| 用户任务列表按状态筛选 | ~15ms (扫描 500 行) | ~3ms (扫描 50 行) | ~5x |
| 用户任务列表按时间排序 | ~12ms (filesort) | ~4ms (索引排序) | ~3x |
| 用户任务状态统计 | ~8ms (扫描全量) | ~2ms (覆盖索引) | ~4x |
| 用户最新任务查询 | ~10ms (filesort) | ~1ms (索引定位) | ~10x |

> 以上数据为基于 10 万条任务记录的估算值，实际性能受数据量和硬件配置影响。

### 4.2 orders 表查询性能对比

| 查询场景 | 优化前（单列索引） | 优化后（复合索引） | 提升幅度 |
|----------|-------------------|-------------------|----------|
| 用户订单列表分页 | ~10ms (filesort) | ~3ms (索引排序) | ~3x |
| 用户近30天订单 | ~8ms (filesort) | ~2ms (索引范围) | ~4x |
| 用户月度消费统计 | ~12ms | ~4ms | ~3x |

### 4.3 admin_logs 表查询性能对比

| 查询场景 | 优化前（单列索引） | 优化后（复合索引） | 提升幅度 |
|----------|-------------------|-------------------|----------|
| 管理员操作日志分页 | ~12ms (filesort) | ~3ms (索引排序) | ~4x |
| 管理员最近操作查询 | ~10ms | ~2ms (索引范围) | ~5x |
| 管理员操作频次统计 | ~15ms | ~5ms | ~3x |

### 4.4 索引空间开销

| 表名 | 新增索引 | 预估空间（10万行） | 说明 |
|------|---------|-------------------|------|
| tasks | idx_user_status | ~3 MB | VARCHAR(36) + ENUM 组合 |
| tasks | idx_user_created | ~5 MB | VARCHAR(36) + TIMESTAMP 组合 |
| orders | idx_user_created | ~4 MB | VARCHAR(36) + TIMESTAMP 组合 |
| admin_logs | idx_admin_created | ~3 MB | VARCHAR(36) + TIMESTAMP 组合 |
| **合计** | **4 个索引** | **~15 MB** | 空间换时间，可接受 |

---

## 5. 索引设计原则

### 5.1 复合索引的最左前缀原则

复合索引 `(a, b, c)` 可以被以下查询使用：
- `WHERE a = ?`
- `WHERE a = ? AND b = ?`
- `WHERE a = ? AND b = ? AND c = ?`

但不能被以下查询使用：
- `WHERE b = ?`
- `WHERE c = ?`
- `WHERE b = ? AND c = ?`

### 5.2 索引列顺序设计

- 高选择性列（区分度高）放在前面
- 等值查询列放在范围查询列之前
- 常用于 ORDER BY 的列放在最后

### 5.3 本次优化的列顺序说明

- `idx_user_status (user_id, status)`: user_id 等值筛选 + status 等值筛选，user_id 选择性更高
- `idx_user_created (user_id, created_at)`: user_id 等值筛选 + created_at 范围/排序，符合最左前缀
- `idx_admin_created (admin_id, created_at)`: admin_id 等值筛选 + created_at 范围/排序，符合最左前缀

---

## 6. 注意事项

### 6.1 索引维护成本

- 每个索引会增加 INSERT/UPDATE/DELETE 操作的开销
- 写入密集场景下需权衡读写性能
- 本项目以读多写少为主，复合索引收益大于成本

### 6.2 索引监控建议

```sql
-- 查看索引使用情况
SELECT * FROM sys.schema_unused_indexes
WHERE object_schema = 'video_remover';

-- 查看冗余索引
SELECT * FROM sys.schema_redundant_indexes
WHERE table_schema = 'video_remover';

-- 查看表的索引信息
SHOW INDEX FROM tasks;
SHOW INDEX FROM orders;
SHOW INDEX FROM admin_logs;
```

### 6.3 后续优化方向

- 根据慢查询日志（slow query log）进一步分析瓶颈
- 考虑对高频查询使用覆盖索引
- 监控索引碎片率，定期执行 `OPTIMIZE TABLE`

---

## 7. 变更记录

| 日期 | 版本 | 变更内容 | 操作人 |
|------|------|---------|--------|
| 2026-06-13 | v1.0 | 新增 4 个复合索引 | - |
