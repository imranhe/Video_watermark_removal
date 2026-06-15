# 牛马去字幕 - API 接口文档

## 📋 文档信息

- **版本**: 1.0.0
- **基础URL**: `https://api.example.com/v1`
- **认证方式**: JWT Token（Bearer Token）
- **数据格式**: JSON
- **字符编码**: UTF-8

---

## 🔐 认证说明

### 获取 Token

```http
POST /auth/login
Content-Type: application/json

{
  "code": "微信登录code"
}
```

### 使用 Token

```http
GET /api/user/info
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token 过期时间

- Access Token: 2 小时
- Refresh Token: 7 天

---

## 📡 通用响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 业务数据
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "错误信息",
  "error": {
    "type": "INVALID_PARAMS",
    "detail": "参数验证失败"
  }
}
```

### 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token无效或过期） |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 1001 | 微信登录失败 |
| 1002 | 用户不存在 |
| 1003 | 积分不足 |
| 1004 | 视频格式不支持 |
| 1005 | 视频大小超限 |
| 1006 | 视频时长超限 |
| 1007 | 任务处理失败 |
| 1008 | 订单创建失败 |
| 1009 | 支付失败 |

---

## 👤 用户相关接口

### 1. 微信登录

**接口**: `POST /auth/login`

**描述**: 使用微信登录码获取用户信息和 Token

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 微信登录码 |

**请求示例**:

```json
{
  "code": "0c3RQs000abc123"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user": {
      "id": "user-uuid-123",
      "openid": "wx_openid_123",
      "nickname": "用户昵称",
      "avatar_url": "https://example.com/avatar.jpg",
      "balance": 100,
      "vip_type": "none",
      "vip_expire_at": null,
      "created_at": "2026-01-01T00:00:00Z"
    },
    "token": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 7200
    }
  }
}
```

**错误响应**:

```json
{
  "code": 1001,
  "message": "微信登录失败",
  "error": {
    "type": "WECHAT_LOGIN_FAILED",
    "detail": "invalid code"
  }
}
```

---

### 2. 刷新 Token

**接口**: `POST /auth/refresh`

**描述**: 使用 Refresh Token 获取新的 Access Token

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh_token | string | 是 | 刷新令牌 |

**请求示例**:

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 7200
  }
}
```

---

### 3. 获取用户信息

**接口**: `GET /user/info`

**描述**: 获取当前登录用户的详细信息

**请求头**:

```
Authorization: Bearer <access_token>
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "user-uuid-123",
    "openid": "wx_openid_123",
    "nickname": "用户昵称",
    "avatar_url": "https://example.com/avatar.jpg",
    "phone": "13800138000",
    "balance": 100,
    "vip_type": "monthly",
    "vip_expire_at": "2026-07-01T00:00:00Z",
    "total_tasks": 50,
    "total_spent": 500,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-06-01T00:00:00Z"
  }
}
```

---

### 4. 更新用户信息

**接口**: `PUT /user/info`

**描述**: 更新用户昵称、头像等信息

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 用户昵称 |
| avatar_url | string | 否 | 头像URL |
| phone | string | 否 | 手机号 |

**请求示例**:

```json
{
  "nickname": "新昵称",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "phone": "13800138000"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "user-uuid-123",
    "nickname": "新昵称",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "phone": "13800138000",
    "updated_at": "2026-06-13T00:00:00Z"
  }
}
```

---

### 5. 获取用户统计

**接口**: `GET /user/stats`

**描述**: 获取用户的统计数据

**请求头**:

```
Authorization: Bearer <access_token>
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total_tasks": 50,
    "completed_tasks": 45,
    "failed_tasks": 5,
    "total_points_used": 500,
    "total_points_recharged": 1000,
    "current_balance": 100,
    "vip_type": "monthly",
    "vip_expire_at": "2026-07-01T00:00:00Z"
  }
}
```

---

## 📹 任务相关接口

### 1. 创建任务

**接口**: `POST /tasks`

**描述**: 创建视频处理任务

**请求头**:

```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| video | file | 是 | 视频文件（mp4, mov, avi） |
| task_type | string | 是 | 处理类型：subtitle/watermark/logo |
| region | object | 否 | 处理区域（JSON格式） |

**region 参数说明**:

```json
{
  "x": 0,
  "y": 0,
  "width": 100,
  "height": 50
}
```

**请求示例**:

```bash
curl -X POST https://api.example.com/v1/tasks \
  -H "Authorization: Bearer <access_token>" \
  -F "video=@/path/to/video.mp4" \
  -F "task_type=subtitle" \
  -F "region={\"x\":0,\"y\":0,\"width\":100,\"height\":50}"
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "task-uuid-123",
    "user_id": "user-uuid-123",
    "video_url": "https://oss.example.com/videos/original/task-uuid-123.mp4",
    "task_type": "subtitle",
    "status": "pending",
    "progress": 0,
    "points_cost": 10,
    "created_at": "2026-06-13T00:00:00Z"
  }
}
```

**错误响应**:

```json
{
  "code": 1003,
  "message": "积分不足",
  "error": {
    "type": "INSUFFICIENT_POINTS",
    "detail": "当前积分: 5, 需要积分: 10"
  }
}
```

---

### 2. 获取任务列表

**接口**: `GET /tasks`

**描述**: 获取用户的任务列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码（默认1） |
| page_size | int | 否 | 每页数量（默认20） |
| status | string | 否 | 状态筛选：pending/processing/completed/failed |
| task_type | string | 否 | 类型筛选：subtitle/watermark/logo |

**请求示例**:

```http
GET /tasks?page=1&page_size=20&status=completed
Authorization: Bearer <access_token>
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "task-uuid-123",
        "video_url": "https://oss.example.com/videos/original/task-uuid-123.mp4",
        "result_url": "https://oss.example.com/videos/processed/task-uuid-123.mp4",
        "task_type": "subtitle",
        "status": "completed",
        "progress": 100,
        "points_cost": 10,
        "created_at": "2026-06-13T00:00:00Z",
        "completed_at": "2026-06-13T00:05:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

---

### 3. 获取任务详情

**接口**: `GET /tasks/:id`

**描述**: 获取指定任务的详细信息

**请求头**:

```
Authorization: Bearer <access_token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 任务ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "task-uuid-123",
    "user_id": "user-uuid-123",
    "video_url": "https://oss.example.com/videos/original/task-uuid-123.mp4",
    "result_url": "https://oss.example.com/videos/processed/task-uuid-123.mp4",
    "task_type": "subtitle",
    "status": "completed",
    "progress": 100,
    "points_cost": 10,
    "params": {
      "region": {
        "x": 0,
        "y": 0,
        "width": 100,
        "height": 50
      }
    },
    "error_message": null,
    "retry_count": 0,
    "priority": 0,
    "created_at": "2026-06-13T00:00:00Z",
    "completed_at": "2026-06-13T00:05:00Z"
  }
}
```

---

### 4. 查询任务进度

**接口**: `GET /tasks/:id/progress`

**描述**: 实时查询任务处理进度

**请求头**:

```
Authorization: Bearer <access_token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 任务ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "task-uuid-123",
    "status": "processing",
    "progress": 65,
    "estimated_time": 120,
    "updated_at": "2026-06-13T00:03:00Z"
  }
}
```

**轮询建议**:
- 处理中状态：每 3 秒轮询一次
- 待处理状态：每 5 秒轮询一次
- 完成/失败状态：停止轮询

---

### 5. 重新处理任务

**接口**: `POST /tasks/:id/retry`

**描述**: 重新处理失败的任务

**请求头**:

```
Authorization: Bearer <access_token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 任务ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "task-uuid-123",
    "status": "pending",
    "progress": 0,
    "retry_count": 1,
    "created_at": "2026-06-13T00:10:00Z"
  }
}
```

**错误响应**:

```json
{
  "code": 1007,
  "message": "任务处理失败",
  "error": {
    "type": "TASK_RETRY_FAILED",
    "detail": "已达到最大重试次数"
  }
}
```

---

### 6. 取消任务

**接口**: `POST /tasks/:id/cancel`

**描述**: 取消待处理或处理中的任务

**请求头**:

```
Authorization: Bearer <access_token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 任务ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "task-uuid-123",
    "status": "cancelled",
    "points_refunded": 10
  }
}
```

**说明**:
- 只有待处理和处理中的任务可以取消
- 取消后积分自动退还

---

### 7. 删除任务

**接口**: `DELETE /tasks/:id`

**描述**: 删除已完成或失败的任务

**请求头**:

```
Authorization: Bearer <access_token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 任务ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "task-uuid-123",
    "deleted": true
  }
}
```

**说明**:
- 只有已完成或失败的任务可以删除
- 删除后视频文件将在 7 天内自动清理

---

### 8. 下载处理后的视频

**接口**: `GET /tasks/:id/download`

**描述**: 获取处理后视频的下载链接

**请求头**:

```
Authorization: Bearer <access_token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 任务ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "download_url": "https://oss.example.com/videos/processed/task-uuid-123.mp4?expires=3600",
    "expires_in": 3600,
    "file_size": 1024000,
    "duration": 120
  }
}
```

**说明**:
- 下载链接有效期 1 小时
- 文件将在 7 天后自动删除

---

## 💰 订单相关接口

### 1. 获取套餐列表

**接口**: `GET /packages`

**描述**: 获取所有可用的套餐列表

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "pkg-1",
        "name": "100积分",
        "type": "points",
        "price": 9.90,
        "credits": 100,
        "duration_days": null,
        "description": "基础套餐",
        "is_active": true,
        "sort_order": 1
      },
      {
        "id": "pkg-2",
        "name": "500积分",
        "type": "points",
        "price": 39.90,
        "credits": 500,
        "duration_days": null,
        "description": "热门套餐",
        "is_active": true,
        "sort_order": 2
      },
      {
        "id": "pkg-3",
        "name": "1000积分",
        "type": "points",
        "price": 69.90,
        "credits": 1000,
        "duration_days": null,
        "description": "超值套餐",
        "is_active": true,
        "sort_order": 3
      },
      {
        "id": "pkg-4",
        "name": "月卡",
        "type": "monthly",
        "price": 19.90,
        "credits": null,
        "duration_days": 30,
        "description": "无限次处理",
        "is_active": true,
        "sort_order": 4
      },
      {
        "id": "pkg-5",
        "name": "季卡",
        "type": "quarterly",
        "price": 49.90,
        "credits": null,
        "duration_days": 90,
        "description": "无限次+优先",
        "is_active": true,
        "sort_order": 5
      },
      {
        "id": "pkg-6",
        "name": "年卡",
        "type": "yearly",
        "price": 169.90,
        "credits": null,
        "duration_days": 365,
        "description": "无限次+优先+高清",
        "is_active": true,
        "sort_order": 6
      }
    ]
  }
}
```

---

### 2. 创建订单

**接口**: `POST /orders`

**描述**: 创建充值订单

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| package_id | string | 是 | 套餐ID |
| payment_method | string | 是 | 支付方式：wechat/alipay |

**请求示例**:

```json
{
  "package_id": "pkg-1",
  "payment_method": "wechat"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "order-uuid-123",
    "order_no": "ORD202606130001",
    "user_id": "user-uuid-123",
    "package_id": "pkg-1",
    "package_name": "100积分",
    "amount": 9.90,
    "credits": 100,
    "status": "pending",
    "payment_method": "wechat",
    "payment_params": {
      "appId": "wx1234567890",
      "timeStamp": "1686652800",
      "nonceStr": "5K8264ILTKCH16CQ2502SI8ZNMTM67VS",
      "package": "prepay_id=wx201410272009395522657a69800",
      "signType": "RSA",
      "paySign": "oR9d8PuhnIc+YZ8cBHFCwfgpaK9gd7vaRvkYD7rthRAZ"
    },
    "created_at": "2026-06-13T00:00:00Z"
  }
}
```

---

### 3. 查询订单状态

**接口**: `GET /orders/:id`

**描述**: 查询订单状态

**请求头**:

```
Authorization: Bearer <access_token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 订单ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "order-uuid-123",
    "order_no": "ORD202606130001",
    "user_id": "user-uuid-123",
    "package_id": "pkg-1",
    "package_name": "100积分",
    "amount": 9.90,
    "credits": 100,
    "status": "paid",
    "payment_method": "wechat",
    "transaction_id": "4200001234202606130000000000",
    "paid_at": "2026-06-13T00:01:00Z",
    "created_at": "2026-06-13T00:00:00Z"
  }
}
```

---

### 4. 获取订单列表

**接口**: `GET /orders`

**描述**: 获取用户的订单列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码（默认1） |
| page_size | int | 否 | 每页数量（默认20） |
| status | string | 否 | 状态筛选：pending/paid/cancelled/refunded |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "order-uuid-123",
        "order_no": "ORD202606130001",
        "package_name": "100积分",
        "amount": 9.90,
        "credits": 100,
        "status": "paid",
        "payment_method": "wechat",
        "paid_at": "2026-06-13T00:01:00Z",
        "created_at": "2026-06-13T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 10,
      "total_pages": 1
    }
  }
}
```

---

### 5. 支付回调（微信）

**接口**: `POST /orders/callback/wechat`

**描述**: 微信支付结果回调

**请求参数**:

```xml
<xml>
  <return_code><![CDATA[SUCCESS]]></return_code>
  <return_msg><![CDATA[OK]]></return_msg>
  <appid><![CDATA[wx1234567890]]></appid>
  <mch_id><![CDATA[1234567890]]></mch_id>
  <nonce_str><![CDATA[5K8264ILTKCH16CQ2502SI8ZNMTM67VS]]></nonce_str>
  <sign><![CDATA[A5D5DB15C85A4D6F1D6F1D6F1D6F1D6F]]></sign>
  <result_code><![CDATA[SUCCESS]]></result_code>
  <prepay_id><![CDATA[wx201410272009395522657a69800]]></prepay_id>
  <trade_type><![CDATA[JSAPI]]></trade_type>
</xml>
```

**响应示例**:

```xml
<xml>
  <return_code><![CDATA[SUCCESS]]></return_code>
  <return_msg><![CDATA[OK]]></return_msg>
</xml>
```

---

## 💎 积分相关接口

### 1. 获取积分余额

**接口**: `GET /points/balance`

**描述**: 获取当前用户的积分余额

**请求头**:

```
Authorization: Bearer <access_token>
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "balance": 100,
    "total_earned": 500,
    "total_spent": 400
  }
}
```

---

### 2. 获取积分记录

**接口**: `GET /points/logs`

**描述**: 获取积分变动记录

**请求头**:

```
Authorization: Bearer <access_token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码（默认1） |
| page_size | int | 否 | 每页数量（默认20） |
| type | string | 否 | 类型筛选：consume/recharge/gift/refund |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "log-uuid-123",
        "user_id": "user-uuid-123",
        "task_id": "task-uuid-123",
        "order_id": null,
        "change_amount": -10,
        "balance_after": 90,
        "type": "consume",
        "description": "处理视频任务",
        "created_at": "2026-06-13T00:05:00Z"
      },
      {
        "id": "log-uuid-124",
        "user_id": "user-uuid-123",
        "task_id": null,
        "order_id": "order-uuid-123",
        "change_amount": 100,
        "balance_after": 100,
        "type": "recharge",
        "description": "购买100积分套餐",
        "created_at": "2026-06-13T00:01:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

---

## 🔔 通知相关接口

### 1. 获取通知列表

**接口**: `GET /notifications`

**描述**: 获取用户的通知列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码（默认1） |
| page_size | int | 否 | 每页数量（默认20） |
| is_read | boolean | 否 | 是否已读筛选 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "notif-uuid-123",
        "user_id": "user-uuid-123",
        "type": "task_complete",
        "title": "任务处理完成",
        "content": "您的视频去字幕任务已完成",
        "is_read": false,
        "created_at": "2026-06-13T00:05:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 10,
      "total_pages": 1
    },
    "unread_count": 5
  }
}
```

---

### 2. 标记通知为已读

**接口**: `PUT /notifications/:id/read`

**描述**: 标记指定通知为已读

**请求头**:

```
Authorization: Bearer <access_token>
```

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 通知ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "notif-uuid-123",
    "is_read": true
  }
}
```

---

### 3. 标记所有通知为已读

**接口**: `PUT /notifications/read-all`

**描述**: 标记所有通知为已读

**请求头**:

```
Authorization: Bearer <access_token>
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "updated_count": 5
  }
}
```

---

## 📝 反馈相关接口

### 1. 提交反馈

**接口**: `POST /feedbacks`

**描述**: 提交用户反馈

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 反馈类型：bug/feature/complaint/other |
| content | string | 是 | 反馈内容 |
| contact | string | 否 | 联系方式 |

**请求示例**:

```json
{
  "type": "bug",
  "content": "视频处理后画质下降严重",
  "contact": "13800138000"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "feedback-uuid-123",
    "type": "bug",
    "content": "视频处理后画质下降严重",
    "status": "pending",
    "created_at": "2026-06-13T00:00:00Z"
  }
}
```

---

### 2. 获取反馈列表

**接口**: `GET /feedbacks`

**描述**: 获取用户的反馈列表

**请求头**:

```
Authorization: Bearer <access_token>
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码（默认1） |
| page_size | int | 否 | 每页数量（默认20） |
| status | string | 否 | 状态筛选：pending/processing/resolved |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "feedback-uuid-123",
        "type": "bug",
        "content": "视频处理后画质下降严重",
        "contact": "13800138000",
        "status": "resolved",
        "reply": "已优化视频处理算法，请重试",
        "created_at": "2026-06-13T00:00:00Z",
        "updated_at": "2026-06-13T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

---

## ⚙️ 系统配置接口

### 1. 获取系统配置

**接口**: `GET /system/config`

**描述**: 获取系统配置信息

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "free_trial_credits": 30,
    "max_video_duration": 300,
    "max_video_size": 100,
    "task_timeout": 600,
    "retry_count": 3,
    "vip_priority": true,
    "content_check": true,
    "maintenance_mode": false,
    "announcement": {
      "title": "系统维护通知",
      "content": "系统将于今晚22:00-23:00进行维护",
      "start_time": "2026-06-13T22:00:00Z",
      "end_time": "2026-06-13T23:00:00Z"
    }
  }
}
```

---

### 2. 获取处理配置

**接口**: `GET /system/processing-config`

**描述**: 获取视频处理配置

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "task_type": "subtitle",
        "points_cost": 10,
        "max_duration_seconds": 300,
        "max_file_size_mb": 100,
        "description": "视频去字幕"
      },
      {
        "task_type": "watermark",
        "points_cost": 15,
        "max_duration_seconds": 300,
        "max_file_size_mb": 100,
        "description": "视频去水印"
      },
      {
        "task_type": "logo",
        "points_cost": 15,
        "max_duration_seconds": 300,
        "max_file_size_mb": 100,
        "description": "视频去图标"
      }
    ]
  }
}
```

---

## 📊 统计接口（管理员）

### 1. 获取今日统计

**接口**: `GET /admin/stats/today`

**描述**: 获取今日统计数据（需要管理员权限）

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "new_users": 50,
    "active_users": 200,
    "total_tasks": 500,
    "completed_tasks": 450,
    "failed_tasks": 50,
    "total_revenue": 1000.00,
    "total_credits_used": 5000
  }
}
```

---

## 📋 接口汇总

### 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/login | 微信登录 |
| POST | /auth/refresh | 刷新Token |

### 用户接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /user/info | 获取用户信息 |
| PUT | /user/info | 更新用户信息 |
| GET | /user/stats | 获取用户统计 |

### 任务接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /tasks | 创建任务 |
| GET | /tasks | 获取任务列表 |
| GET | /tasks/:id | 获取任务详情 |
| GET | /tasks/:id/progress | 查询任务进度 |
| POST | /tasks/:id/retry | 重新处理任务 |
| POST | /tasks/:id/cancel | 取消任务 |
| DELETE | /tasks/:id | 删除任务 |
| GET | /tasks/:id/download | 下载处理后视频 |

### 订单接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /packages | 获取套餐列表 |
| POST | /orders | 创建订单 |
| GET | /orders/:id | 查询订单状态 |
| GET | /orders | 获取订单列表 |
| POST | /orders/callback/wechat | 微信支付回调 |

### 积分接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /points/balance | 获取积分余额 |
| GET | /points/logs | 获取积分记录 |

### 通知接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /notifications | 获取通知列表 |
| PUT | /notifications/:id/read | 标记通知已读 |
| PUT | /notifications/read-all | 标记所有已读 |

### 反馈接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /feedbacks | 提交反馈 |
| GET | /feedbacks | 获取反馈列表 |

### 系统接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /system/config | 获取系统配置 |
| GET | /system/processing-config | 获取处理配置 |

### 管理员接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /admin/stats/today | 获取今日统计 |

---

**更新时间**: 2026-06-13
**版本**: 1.0.0