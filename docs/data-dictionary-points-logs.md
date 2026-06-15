# 积分记录表 (points_logs)

## 概述

`points_logs` 表记录所有积分变动明细，是积分系统的核心审计表。每次积分增减都会在此表中产生一条记录，确保积分流水可追溯。

## 表结构

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 记录唯一标识 (UUID) |
| user_id | VARCHAR(36) | NOT NULL, FK | - | 关联用户 ID |
| task_id | VARCHAR(36) | - | NULL | 关联任务 ID（消费时关联） |
| order_id | VARCHAR(36) | - | NULL | 关联订单 ID（充值时关联） |
| change_amount | INT | NOT NULL | - | 变动数量（正为增加，负为扣除） |
| balance_after | INT | NOT NULL | - | 变动后余额 |
| type | ENUM | NOT NULL | - | 变动类型 |
| description | VARCHAR(200) | - | NULL | 变动说明 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

## 字段说明

### change_amount

积分变动数量。正数表示增加（充值、赠送、退还），负数表示扣除（消费）。例如：

- `100` 表示充值 100 积分
- `-10` 表示消费 10 积分
- `-5` 表示退还后扣除 5 积分

### balance_after

变动发生后的账户积分余额快照。该字段用于：

- 快速查询任意时间点的积分余额
- 积分流水对账和审计
- 避免对历史记录进行聚合计算

### type

变动类型枚举：

| 值 | 说明 | change_amount 符号 |
|----|------|-------------------|
| consume | 消费（处理任务扣除积分） | 负 |
| recharge | 充值（购买积分套餐） | 正 |
| gift | 赠送（新用户赠送、活动奖励） | 正 |
| refund | 退还（任务失败退款） | 正 |

### task_id

关联任务 ID。仅在 `type = 'consume'` 或 `type = 'refund'` 时有值，标识本次积分变动对应的处理任务。

### order_id

关联订单 ID。仅在 `type = 'recharge'` 时有值，标识本次积分变动对应的充值订单。

## 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| PRIMARY | id | 主键 |
| idx_user_id | user_id | 按用户查询积分记录 |
| idx_type | type | 按变动类型筛选 |
| idx_created_at | created_at | 按时间排序和范围查询 |
| idx_task_id | task_id | 按任务查询关联的积分变动 |
| idx_order_id | order_id | 按订单查询关联的积分变动 |
| idx_user_created | user_id, created_at | 复合索引：按用户分页查询（最常用查询模式） |

## 外键

| 源字段 | 目标表.字段 | 删除策略 |
|--------|------------|----------|
| user_id | users.id | CASCADE (删除用户时级联删除积分记录) |

## DDL 语句

```sql
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
    INDEX idx_user_created (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分记录表';
```

## 常见查询

### 查询用户积分流水（分页）

```sql
SELECT * FROM points_logs
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

### 查询用户积分汇总

```sql
SELECT
    COALESCE(SUM(CASE WHEN change_amount > 0 THEN change_amount ELSE 0 END), 0) AS total_earned,
    COALESCE(SUM(CASE WHEN change_amount < 0 THEN ABS(change_amount) ELSE 0 END), 0) AS total_spent
FROM points_logs
WHERE user_id = ?;
```

### 查询指定任务的积分扣减记录

```sql
SELECT * FROM points_logs
WHERE task_id = ? AND type = 'consume'
LIMIT 1;
```

## 数据生成时机

| 场景 | type | change_amount | 触发代码 |
|------|------|---------------|----------|
| 新用户注册赠送 | gift | +30 | auth.service.js |
| 创建任务扣减积分 | consume | -(任务消耗) | points.service.js -> deductPoints() |
| 购买积分套餐充值 | recharge | +(套餐积分) | points.service.js -> addPoints() |
| 任务失败退还积分 | refund | +(原扣除金额) | task.service.js |

## 注意事项

1. **原子操作**：积分扣减使用数据库事务 + `SELECT ... FOR UPDATE` 悲观锁，配合 `version` 乐观锁双重保障。
2. **余额快照**：`balance_after` 字段存储变动后的余额快照，避免回溯计算。查询历史余额时直接读取该字段。
3. **分区策略**：当日增量较高时（超过 5,000 条/天），建议按 `created_at` 进行 RANGE 按月分区，保留周期 6-12 个月。分区后外键约束需由应用层保证。
4. **不可修改**：积分记录一经写入不可修改或删除（软删除），确保积分流水完整性。
