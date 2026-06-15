# 乐观锁使用指南

本文档说明视频去字幕小程序数据库中乐观锁（Optimistic Locking）的实现方案和使用规范。

## 乐观锁原理

乐观锁是一种并发控制机制，假设多个事务操作同一条记录时不会频繁冲突。更新时通过 `version` 字段校验记录是否被其他事务修改过，冲突时返回失败由调用方重试。

**乐观锁 vs 悲观锁：**

| 特性 | 乐观锁 | 悲观锁 |
|------|--------|--------|
| 锁定方式 | 不锁定，更新时校验 | SELECT FOR UPDATE 锁定行 |
| 冲突处理 | 失败重试 | 等待锁释放 |
| 并发性能 | 高（读多写少场景） | 低（阻塞等待） |
| 适用场景 | 冲突率低、读多写少 | 冲突率高、写操作频繁 |
| 实现复杂度 | 低 | 中 |

## 已启用乐观锁的表

| 表名 | 字段 | 初始值 | 说明 |
|------|------|--------|------|
| users | `version` | 0 | 用户数据版本号 |
| tasks | `version` | 0 | 任务数据版本号 |
| orders | `version` | 0 | 订单数据版本号 |

## 实现方案

### 更新流程

1. 读取记录并记录当前 `version` 值
2. 应用层处理业务逻辑
3. 执行 UPDATE 时将 `version` 作为 WHERE 条件
4. 检查受影响行数：为 0 表示冲突

### 更新示例

**更新用户积分（带乐观锁）：**

```sql
-- Step 1: 读取当前版本
SELECT id, balance, version
FROM users
WHERE id = 'user-id';

-- 假设返回 version = 3, balance = 100

-- Step 2: 更新时校验版本号
UPDATE users
SET balance = balance + 50,
    version = version + 1
WHERE id = 'user-id'
  AND version = 3;

-- Step 3: 检查 affected rows
-- affected_rows = 1  --> 更新成功
-- affected_rows = 0  --> 版本冲突，需重试
```

**更新任务状态（带乐观锁）：**

```sql
-- Step 1: 读取当前版本
SELECT id, status, progress, version
FROM tasks
WHERE id = 'task-id';

-- 假设返回 version = 5, status = 'processing', progress = 60

-- Step 2: 更新任务进度
UPDATE tasks
SET progress = 80,
    version = version + 1
WHERE id = 'task-id'
  AND version = 5;

-- Step 3: affected_rows = 0 表示任务已被其他进程更新
```

**更新订单状态（带乐观锁）：**

```sql
-- Step 1: 读取当前版本
SELECT id, status, version
FROM orders
WHERE id = 'order-id';

-- 假设返回 version = 1, status = 'pending'

-- Step 2: 确认支付
UPDATE orders
SET status = 'paid',
    version = version + 1
WHERE id = 'order-id'
  AND version = 1
  AND status = 'pending';

-- 额外校验 status = 'pending' 防止重复支付
```

### 条件更新（防止重复操作）

```sql
-- 防止任务重复标记完成
UPDATE tasks
SET status = 'completed',
    completed_at = NOW(),
    progress = 100,
    version = version + 1
WHERE id = 'task-id'
  AND version = 5
  AND status = 'processing';

-- 防止积分重复扣减
UPDATE users
SET balance = balance - 10,
    version = version + 1
WHERE id = 'user-id'
  AND version = 3
  AND balance >= 10;
```

## 冲突处理

### 重试策略

当乐观锁冲突时（affected_rows = 0），按以下策略重试：

```
第 1 次重试：等待 50ms
第 2 次重试：等待 100ms
第 3 次重试：等待 200ms
第 4 次重试：等待 400ms
第 5 次重试：放弃并返回错误
```

采用指数退避策略，最多重试 3-5 次。

### 冸突检测

```sql
-- 更新后重新查询，判断是否成功
UPDATE tasks
SET progress = 80, version = version + 1
WHERE id = 'task-id' AND version = 5;

-- 如果 affected_rows = 0，重新读取最新数据
SELECT id, status, progress, version
FROM tasks
WHERE id = 'task-id';
-- 应用层对比 version 变化，决定是否重试或放弃
```

### 乐观锁 + 软删除

当表同时支持乐观锁和软删除时：

```sql
-- 软删除带乐观锁校验
UPDATE tasks
SET deleted_at = NOW(),
    version = version + 1
WHERE id = 'task-id'
  AND version = 5
  AND deleted_at IS NULL;

-- 恢复带乐观锁校验
UPDATE tasks
SET deleted_at = NULL,
    version = version + 1
WHERE id = 'task-id'
  AND version = 6
  AND deleted_at IS NOT NULL;
```

## 应用层集成建议

### TypeScript 类型定义

```typescript
interface OptimisticLockEntity {
  version: number;
}

interface UpdateResult {
  success: boolean;
  affectedRows: number;
  newVersion?: number;
}
```

### 通用更新函数模式

```typescript
async function updateWithOptimisticLock<T extends OptimisticLockEntity>(
  id: string,
  currentVersion: number,
  updates: Partial<T>,
  maxRetries = 3
): Promise<UpdateResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await db.update(table, {
      ...updates,
      version: currentVersion + 1,
    }, {
      id,
      version: currentVersion,
    });

    if (result.affectedRows > 0) {
      return { success: true, affectedRows: 1, newVersion: currentVersion + 1 };
    }

    if (attempt < maxRetries) {
      // 指数退避
      await sleep(50 * Math.pow(2, attempt));
      // 重新读取最新版本
      const latest = await db.findById(table, id);
      currentVersion = latest.version;
    }
  }

  return { success: false, affectedRows: 0 };
}
```

## 注意事项

1. **version 不能回退** - 版本号只递增，不要手动修改或重置
2. **先读后写** - 必须先读取当前 version，再用于 UPDATE 条件
3. **检查 affected_rows** - 不检查受影响行数将无法发现冲突
4. **合理设置重试次数** - 避免无限重试导致性能问题
5. **数据库层面无保障** - 乐观锁是应用层实现，数据库不强制校验 version
6. **高冲突场景考虑悲观锁** - 如果冲突率超过 10%，考虑使用 SELECT FOR UPDATE
