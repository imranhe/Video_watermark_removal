# 数据字典

本文档描述视频去字幕小程序数据库中所有表的字段定义、类型约束和表间关系。

## 表索引

| 序号 | 表名 | 说明 |
|------|------|------|
| 1 | users | 用户表 |
| 2 | tasks | 任务表 |
| 3 | orders | 订单表 |
| 4 | usage_logs | 使用记录表 |
| 5 | roles | 角色表 |
| 6 | admins | 管理员表 |
| 7 | admin_logs | 操作日志表 |
| 8 | system_configs | 系统配置表 |
| 9 | announcements | 公告表 |
| 10 | faqs | FAQ 表 |
| 11 | points_logs | 积分记录表 |
| 12 | packages | 套餐表 |
| 13 | notifications | 通知表 |
| 14 | feedbacks | 反馈表 |

---

## 1. users（用户表）

存储小程序端注册用户信息。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 用户唯一标识 (UUID) |
| openid | VARCHAR(100) | UNIQUE, NOT NULL | - | 微信/支付宝 openid |
| nickname | VARCHAR(50) | NOT NULL | - | 用户昵称 |
| avatar_url | VARCHAR(500) | - | NULL | 头像 URL |
| phone | VARCHAR(20) | - | NULL | 手机号 |
| balance | INT | - | 0 | 积分余额 |
| vip_type | ENUM | - | 'none' | VIP 类型: none/monthly/quarterly/yearly |
| vip_expire_at | TIMESTAMP | - | NULL | VIP 到期时间 |
| total_tasks | INT | - | 0 | 总任务数 |
| total_spent | DECIMAL(10,2) | - | 0.00 | 总消费金额（元） |
| version | INT | - | 0 | 乐观锁版本号 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |
| deleted_at | TIMESTAMP | - | NULL | 软删除时间 |

**索引：** idx_openid (openid), idx_created_at (created_at), idx_deleted_at (deleted_at), idx_vip_type (vip_type)

---

## 2. tasks（任务表）

存储视频处理任务信息。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 任务唯一标识 (UUID) |
| user_id | VARCHAR(36) | NOT NULL, FK | - | 关联用户 ID |
| video_url | VARCHAR(500) | NOT NULL | - | 原始视频 URL |
| result_url | VARCHAR(500) | - | NULL | 处理后视频 URL |
| status | ENUM | - | 'pending' | 任务状态: pending/processing/completed/failed |
| task_type | ENUM | NOT NULL | - | 任务类型: subtitle(去字幕)/icon(去图标) |
| progress | INT | - | 0 | 任务进度 (0-100) |
| error_message | VARCHAR(500) | - | NULL | 失败原因 |
| params | JSON | - | NULL | 任务参数 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| completed_at | TIMESTAMP | - | NULL | 完成时间 |

**索引：** idx_user_id (user_id), idx_status (status), idx_created_at (created_at), idx_user_status (user_id, status), idx_user_created (user_id, created_at)

**外键：** user_id -> users(id) ON DELETE CASCADE

---

## 3. orders（订单表）

存储用户购买积分的订单信息。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 订单唯一标识 (UUID) |
| order_no | VARCHAR(50) | UNIQUE, NOT NULL | - | 订单编号（唯一） |
| user_id | VARCHAR(36) | NOT NULL, FK | - | 关联用户 ID |
| package_id | VARCHAR(36) | - | NULL | 套餐 ID |
| package_name | VARCHAR(100) | - | NULL | 套餐名称 |
| amount | DECIMAL(10,2) | NOT NULL | - | 订单金额 (元) |
| credits | INT | NOT NULL | - | 购买积分数量 |
| status | ENUM | - | 'pending' | 订单状态: pending/paid/cancelled/refunded |
| payment_method | VARCHAR(20) | - | NULL | 支付方式 (wechat/alipay) |
| payment_params | JSON | - | NULL | 支付参数（微信/支付宝预付单参数） |
| platform | ENUM | NOT NULL | - | 支付平台: wechat(微信)/alipay(支付宝) |
| transaction_id | VARCHAR(100) | - | NULL | 支付平台交易号 |
| paid_at | TIMESTAMP | - | NULL | 支付完成时间 |
| version | INT | - | 0 | 乐观锁版本号 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |
| deleted_at | TIMESTAMP | - | NULL | 软删除时间 |

**索引：** idx_user_id (user_id), idx_status (status), idx_created_at (created_at), idx_user_created (user_id, created_at), idx_deleted_at (deleted_at), idx_order_no (order_no)

**外键：** user_id -> users(id) ON DELETE CASCADE

---

## 4. usage_logs（使用记录表）

记录用户每次使用积分的明细。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 记录唯一标识 (UUID) |
| user_id | VARCHAR(36) | NOT NULL, FK | - | 关联用户 ID |
| task_id | VARCHAR(36) | NOT NULL, FK | - | 关联任务 ID |
| credit_used | INT | NOT NULL | - | 消费积分数量 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**索引：** idx_user_id (user_id), idx_task_id (task_id), idx_created_at (created_at)

**外键：** user_id -> users(id) ON DELETE CASCADE, task_id -> tasks(id) ON DELETE CASCADE

**分区策略：** RANGE 按月分区，分区键为 `created_at`（UNIX_TIMESTAMP）。主键调整为 `(id, created_at)` 以满足 MySQL 分区约束。保留周期 6 个月，过期分区通过 `DROP PARTITION` 删除。日增量较高（5,000-50,000 条），分区对查询和清理性能提升显著。详见 `database-partitioning.md` 和 `database/partition-maintenance.sql`。

> **注意：** 分区表不支持外键约束。启用分区后，`usage_logs.user_id` 和 `usage_logs.task_id` 的引用完整性需由应用层保证。

---

## 5. roles（角色表）

定义后台管理系统的角色。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 角色唯一标识 (UUID) |
| name | VARCHAR(50) | UNIQUE, NOT NULL | - | 角色名称 |
| permissions | JSON | - | NULL | 权限列表 (JSON 数组) |
| description | VARCHAR(200) | - | NULL | 角色描述 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

---

## 6. admins（管理员表）

存储后台管理系统管理员账号信息。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 管理员唯一标识 (UUID) |
| username | VARCHAR(50) | UNIQUE, NOT NULL | - | 登录用户名 |
| password_hash | VARCHAR(255) | NOT NULL | - | 密码哈希 (bcrypt) |
| name | VARCHAR(50) | NOT NULL | - | 显示名称 |
| email | VARCHAR(100) | - | NULL | 邮箱 |
| role_id | VARCHAR(36) | NOT NULL, FK | - | 关联角色 ID |
| status | ENUM | - | 'active' | 账号状态: active(启用)/disabled(禁用) |
| last_login_at | TIMESTAMP | - | NULL | 最后登录时间 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：** idx_username (username), idx_role_id (role_id)

**外键：** role_id -> roles(id) ON DELETE RESTRICT

---

## 7. admin_logs（操作日志表）

记录管理员在后台的所有操作。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 日志唯一标识 (UUID) |
| admin_id | VARCHAR(36) | NOT NULL, FK | - | 操作管理员 ID |
| action | VARCHAR(100) | NOT NULL | - | 操作类型 (如 create_user, update_order) |
| target_type | VARCHAR(50) | - | NULL | 操作对象类型 (如 user, order, task) |
| target_id | VARCHAR(36) | - | NULL | 操作对象 ID |
| detail | JSON | - | NULL | 操作详情 |
| ip | VARCHAR(45) | - | NULL | 客户端 IP 地址 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**索引：** idx_admin_id (admin_id), idx_action (action), idx_created_at (created_at), idx_admin_created (admin_id, created_at)

**外键：** admin_id -> admins(id) ON DELETE CASCADE

**分区策略：** RANGE 按月分区，分区键为 `created_at`（UNIX_TIMESTAMP）。主键调整为 `(id, created_at)` 以满足 MySQL 分区约束。保留周期 12 个月，过期分区通过 `DROP PARTITION` 删除。详见 `database-partitioning.md` 和 `database/partition-maintenance.sql`。

> **注意：** 分区表不支持外键约束。启用分区后，`admin_logs.admin_id` 到 `admins.id` 的引用完整性需由应用层保证。

---

## 8. system_configs（系统配置表）

存储全局可配置的系统参数。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 配置唯一标识 (UUID) |
| config_key | VARCHAR(100) | UNIQUE, NOT NULL | - | 配置键名 |
| config_value | TEXT | - | NULL | 配置值 |
| description | VARCHAR(200) | - | NULL | 配置说明 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：** idx_config_key (config_key)

---

## 9. announcements（公告表）

存储面向小程序用户的公告信息。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 公告唯一标识 (UUID) |
| title | VARCHAR(200) | NOT NULL | - | 公告标题 |
| content | TEXT | NOT NULL | - | 公告内容 (支持富文本) |
| status | ENUM | - | 'draft' | 状态: draft(草稿)/published(已发布)/archived(已归档) |
| published_at | TIMESTAMP | - | NULL | 发布时间 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：** idx_status (status), idx_published_at (published_at)

---

## 10. faqs（FAQ 表）

存储常见问题及解答。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | FAQ 唯一标识 (UUID) |
| question | VARCHAR(500) | NOT NULL | - | 问题 |
| answer | TEXT | NOT NULL | - | 回答内容 |
| sort_order | INT | - | 0 | 排序权重 (升序排列) |
| status | ENUM | - | 'active' | 显示状态: active(显示)/hidden(隐藏) |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：** idx_status (status), idx_sort_order (sort_order)

---

## 11. points_logs（积分记录表）

记录用户积分变动明细，包括消费、充值、赠送和退还。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 记录唯一标识 (UUID) |
| user_id | VARCHAR(36) | NOT NULL, FK | - | 关联用户 ID |
| task_id | VARCHAR(36) | - | NULL | 关联任务 ID（消费时关联） |
| order_id | VARCHAR(36) | - | NULL | 关联订单 ID（充值时关联） |
| change_amount | INT | NOT NULL | - | 变动数量（正为增加，负为扣除） |
| balance_after | INT | NOT NULL | - | 变动后余额 |
| type | ENUM | NOT NULL | - | 变动类型: consume(消费)/recharge(充值)/gift(赠送)/refund(退还) |
| description | VARCHAR(200) | - | NULL | 变动说明 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**索引：** idx_user_id (user_id), idx_type (type), idx_created_at (created_at), idx_task_id (task_id), idx_order_id (order_id), idx_user_created (user_id, created_at)

**外键：** user_id -> users(id) ON DELETE CASCADE

---

## 12. packages（套餐表）

存储积分和 VIP 套餐信息。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 套餐唯一标识 (UUID) |
| name | VARCHAR(100) | NOT NULL | - | 套餐名称 |
| type | ENUM | NOT NULL | - | 套餐类型: points(积分)/monthly(月卡)/quarterly(季卡)/yearly(年卡) |
| price | DECIMAL(10,2) | NOT NULL | - | 价格（元） |
| credits | INT | - | NULL | 积分数量（积分套餐） |
| duration_days | INT | - | NULL | 有效期天数（VIP 套餐） |
| description | VARCHAR(500) | - | NULL | 套餐描述 |
| is_active | BOOLEAN | - | true | 是否上架 |
| sort_order | INT | - | 0 | 排序权重 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：** idx_type (type), idx_active (is_active), idx_sort (sort_order)

---

## 13. notifications（通知表）

存储面向小程序用户的系统通知。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 通知唯一标识 (UUID) |
| user_id | VARCHAR(36) | NOT NULL, FK | - | 关联用户 ID |
| type | VARCHAR(50) | NOT NULL | - | 通知类型: task_complete/payment_success/system |
| title | VARCHAR(200) | NOT NULL | - | 通知标题 |
| content | TEXT | - | NULL | 通知内容 |
| is_read | BOOLEAN | - | false | 是否已读 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**索引：** idx_user_id (user_id), idx_is_read (is_read), idx_created_at (created_at)

**外键：** user_id -> users(id) ON DELETE CASCADE

---

## 14. feedbacks（反馈表）

存储用户反馈信息。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | VARCHAR(36) | PRIMARY KEY | - | 反馈唯一标识 (UUID) |
| user_id | VARCHAR(36) | NOT NULL, FK | - | 关联用户 ID |
| type | ENUM | NOT NULL | - | 反馈类型: bug(问题)/feature(建议)/complaint(投诉)/other(其他) |
| content | TEXT | NOT NULL | - | 反馈内容 |
| contact | VARCHAR(100) | - | NULL | 联系方式 |
| status | ENUM | - | 'pending' | 处理状态: pending(待处理)/processing(处理中)/resolved(已解决) |
| reply | TEXT | - | NULL | 管理员回复 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：** idx_user_id (user_id), idx_status (status), idx_created_at (created_at)

**外键：** user_id -> users(id) ON DELETE CASCADE

---

## 表关系说明

```
users (用户表)
  |
  |-- 1:N --> tasks (任务表)          一个用户可以有多个任务
  |-- 1:N --> orders (订单表)         一个用户可以有多个订单
  |-- 1:N --> usage_logs (使用记录)   一个用户可以有多条使用记录
  |-- 1:N --> points_logs (积分记录)  一个用户可以有多条积分记录
  |-- 1:N --> notifications (通知)    一个用户可以有多条通知
  |-- 1:N --> feedbacks (反馈)        一个用户可以有多条反馈

tasks (任务表)
  |
  |-- 1:N --> usage_logs (使用记录)   一个任务对应一条使用记录
  |-- 1:N --> points_logs (积分记录)  一个任务可关联一条积分扣减记录

orders (订单表)
  |
  |-- 1:N --> points_logs (积分记录)  一个订单可关联一条积分充值记录

roles (角色表)
  |
  |-- 1:N --> admins (管理员表)       一个角色可以分配给多个管理员

admins (管理员表)
  |
  |-- 1:N --> admin_logs (操作日志)   一个管理员可以有多条操作日志
```

### 关系约束说明

| 源表.字段 | 目标表.字段 | 关系 | 删除策略 |
|-----------|------------|------|----------|
| tasks.user_id | users.id | N:1 | CASCADE (删除用户时级联删除任务) |
| orders.user_id | users.id | N:1 | CASCADE (删除用户时级联删除订单) |
| usage_logs.user_id | users.id | N:1 | CASCADE (删除用户时级联删除记录) |
| usage_logs.task_id | tasks.id | N:1 | CASCADE (删除任务时级联删除记录) |
| points_logs.user_id | users.id | N:1 | CASCADE (删除用户时级联删除积分记录) |
| notifications.user_id | users.id | N:1 | CASCADE (删除用户时级联删除通知) |
| feedbacks.user_id | users.id | N:1 | CASCADE (删除用户时级联删除反馈) |
| admins.role_id | roles.id | N:1 | RESTRICT (有管理员引用时禁止删除角色) |
| admin_logs.admin_id | admins.id | N:1 | CASCADE (删除管理员时级联删除日志) |

---

## 分区策略说明

### 需要分区的表

| 表名 | 分区方式 | 分区键 | 保留周期 | 预估日增量 |
|------|---------|--------|---------|-----------|
| admin_logs | RANGE 按月 | created_at | 12 个月 | 500 - 2,000 条 |
| usage_logs | RANGE 按月 | created_at | 6 个月 | 5,000 - 50,000 条 |

### 分区对表结构的影响

1. **主键变更**：原主键 `id VARCHAR(36)` 调整为 `(id, created_at)`，因为 MySQL 分区要求分区键必须包含在主键和所有唯一索引中。
2. **外键移除**：分区表不支持外键约束，需在应用层保证数据引用完整性。
3. **查询约束**：所有查询必须包含 `created_at` 条件以触发分区裁剪，否则将扫描全部分区。

### 分区维护

- 每月初自动创建未来 3 个月的分区（cron 或 MySQL Event Scheduler）。
- 每月自动清理超过保留周期的过期分区（`DROP PARTITION`）。
- 维护脚本位于 `database/partition-maintenance.sql`。
- 完整策略文档位于 `docs/database-partitioning.md`。
