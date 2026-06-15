# 牛马去字幕 - API Reference

## 1. 概述

### API 版本

当前版本: **v1.0.0**

### 基础 URL

| 环境 | URL |
|------|-----|
| 开发环境 | `http://localhost:3000` |
| 测试环境 | `https://test-api.example.com` |
| 生产环境 | `https://api.example.com` |

### 认证方式

本 API 使用 **JWT (JSON Web Token)** 进行身份认证。

认证流程:
1. 客户端调用微信/支付宝登录接口获取 `code` / `authCode`
2. 将 `code` / `authCode` 发送到服务端登录接口
3. 服务端返回 `access_token` 和 `refresh_token`
4. 后续请求在 HTTP Header 中携带 `Authorization: Bearer <access_token>`
5. Token 过期后使用 `refresh_token` 刷新

**请求头格式:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 通用请求格式

**Content-Type:** `application/json` (除文件上传外)

所有请求体均为 JSON 格式，字符编码 UTF-8。

### 通用响应格式

**成功响应:**

```json
{
  "code": 0,
  "data": { ... },
  "message": "success"
}
```

**失败响应:**

```json
{
  "code": 40001,
  "data": null,
  "message": "参数错误: filename 不能为空"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 状态码。0 表示成功，非 0 表示错误 |
| data | any | 响应数据，失败时为 null |
| message | string | 响应消息 |

### 通用请求头

| Header | 必填 | 说明 |
|--------|------|------|
| Authorization | 否 | JWT Token，登录后需要携带 |
| Content-Type | 是 | 请求体格式，`application/json` |
| X-Request-Id | 否 | 请求追踪 ID，用于日志排查 |

### 分页参数

支持分页的接口统一使用以下 Query 参数:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码，从 1 开始 |
| pageSize | number | 20 | 每页数量，最大 100 |

**分页响应格式:**

```json
{
  "code": 0,
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  },
  "message": "success"
}
```

### 限流策略

| 接口类型 | 限制 | 时间窗口 |
|----------|------|----------|
| 通用 API | 100 次/IP | 15 分钟 |
| 任务创建 | 5 次/用户 | 1 分钟 |
| 文件上传 | 10 次/用户 | 1 分钟 |
| 登录接口 | 10 次/IP | 15 分钟 |

超过限流返回 HTTP 429 状态码:

```json
{
  "code": 42900,
  "data": null,
  "message": "请求过于频繁，请稍后再试"
}
```

---

## 2. 认证 API

### 2.1 微信小程序登录

微信小程序用户通过 `wx.login()` 获取 `code` 后调用此接口完成登录。

**请求:**

```
POST /v1/auth/login
```

**Headers:**

| Header | 值 |
|--------|---|
| Content-Type | application/json |

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 微信小程序 `wx.login()` 返回的登录凭证 |
| nickname | string | 否 | 用户昵称（首次登录时可传入） |
| avatarUrl | string | 否 | 用户头像 URL（首次登录时可传入） |

**请求示例:**

```json
{
  "code": "0c3RjVlG4bXmN8wKpQ2fHa",
  "nickname": "用户昵称",
  "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/xxx/132"
}
```

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "expires_in": 604800,
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "openid": "oXbM05RJz9s8pQ2fHaLk4",
      "nickname": "用户昵称",
      "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/xxx/132",
      "balance": 30,
      "vipType": "none",
      "vipExpireAt": null,
      "createdAt": "2026-06-13T10:00:00.000Z"
    }
  },
  "message": "success"
}
```

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40001 | 400 | code 参数缺失或为空 |
| 40101 | 401 | 微信 code 已过期或无效 |
| 50001 | 500 | 微信服务端异常 |

**错误响应示例:**

```json
{
  "code": 40101,
  "data": null,
  "message": "微信登录凭证已过期，请重新获取"
}
```

---

### 2.2 支付宝小程序登录

支付宝小程序用户通过 `my.getAuthCode()` 获取 `authCode` 后调用此接口完成登录。

**请求:**

```
POST /v1/auth/login
```

**Headers:**

| Header | 值 |
|--------|---|
| Content-Type | application/json |

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| authCode | string | 是 | 支付宝 `my.getAuthCode()` 返回的授权码 |
| nickname | string | 否 | 用户昵称 |
| avatarUrl | string | 否 | 用户头像 URL |

**请求示例:**

```json
{
  "authCode": "2026061300001abcdef",
  "nickname": "支付宝用户",
  "avatarUrl": "https://tfs.alipayobjects.com/xxx.jpg"
}
```

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "expires_in": 604800,
    "user": {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "openid": "2088102177965432",
      "nickname": "支付宝用户",
      "avatarUrl": "https://tfs.alipayobjects.com/xxx.jpg",
      "balance": 30,
      "vipType": "none",
      "vipExpireAt": null,
      "createdAt": "2026-06-13T10:00:00.000Z"
    }
  },
  "message": "success"
}
```

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40001 | 400 | authCode 参数缺失或为空 |
| 40101 | 401 | 支付宝授权码已过期或无效 |
| 50001 | 500 | 支付宝服务端异常 |

---

### 2.3 刷新 Token

当 `access_token` 过期时，使用 `refresh_token` 获取新的 Token 对。

**请求:**

```
POST /v1/auth/refresh
```

**Headers:**

| Header | 值 |
|--------|---|
| Content-Type | application/json |

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh_token | string | 是 | 登录时返回的刷新令牌 |

**请求示例:**

```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new...",
    "refresh_token": "dGhpcyBpcyBhIG5ldyByZWZyZXNoIHRva2Vu...",
    "expires_in": 604800
  },
  "message": "success"
}
```

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40001 | 400 | refresh_token 参数缺失 |
| 40102 | 401 | refresh_token 已过期或无效，需重新登录 |
| 40103 | 401 | refresh_token 已被使用（Token 重放攻击检测） |

---

## 3. 文件上传 API

文件上传采用分片上传方案，支持大文件（最大 100MB）、断点续传、进度追踪。

**上传流程:**

```
1. POST /v1/upload/init     --> 获取 uploadId 和分片信息
2. POST /v1/upload/chunk    --> 逐片上传（可并发）
3. GET  /v1/upload/status    --> 查询上传进度（断点续传时使用）
4. POST /v1/upload/merge     --> 合并所有分片，返回最终文件 URL
```

### 3.1 初始化上传

创建上传任务，获取 `uploadId` 和分片规划。

**请求:**

```
POST /v1/upload/init
```

**Headers:**

| Header | 值 |
|--------|---|
| Content-Type | application/json |
| Authorization | Bearer \<token\> |

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | 是 | 原始文件名，如 `video.mp4` |
| fileSize | number | 是 | 文件大小（字节），最大 104857600 (100MB) |
| chunkSize | number | 否 | 分片大小（字节），默认 2097152 (2MB) |
| mimeType | string | 否 | MIME 类型，默认 `video/mp4` |

**请求示例:**

```json
{
  "filename": "my_video.mp4",
  "fileSize": 52428800,
  "chunkSize": 2097152,
  "mimeType": "video/mp4"
}
```

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "uploadId": "up_a1b2c3d4e5f6",
    "filename": "my_video.mp4",
    "fileSize": 52428800,
    "chunkSize": 2097152,
    "totalChunks": 25,
    "uploadedChunks": []
  },
  "message": "success"
}
```

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40001 | 400 | filename 或 fileSize 缺失 |
| 40002 | 400 | 文件大小超过限制 (100MB) |
| 40003 | 400 | 不支持的文件类型 |
| 40004 | 400 | chunkSize 不合法（范围: 1MB - 10MB） |
| 42900 | 429 | 上传频率超限 |

---

### 3.2 上传分片

逐个上传文件分片。支持并发上传（建议并发数 3）和断点续传。

**请求:**

```
POST /v1/upload/chunk
```

**Headers:**

| Header | 值 | 说明 |
|--------|---|------|
| Content-Type | application/octet-stream | 分片二进制数据 |
| Authorization | Bearer \<token\> | JWT Token |
| X-Upload-Id | string | 初始化返回的 uploadId |
| X-Chunk-Index | number | 当前分片索引（从 0 开始） |
| X-Total-Chunks | number | 分片总数 |
| Content-MD5 | string | 可选，分片数据的 MD5 校验值 |

**请求体:**

分片的原始二进制数据。

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "uploadId": "up_a1b2c3d4e5f6",
    "chunkIndex": 0,
    "uploadedChunks": [0],
    "totalChunks": 25
  },
  "message": "success"
}
```

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40001 | 400 | X-Upload-Id 或 X-Chunk-Index 缺失 |
| 40005 | 400 | uploadId 不存在或已过期 |
| 40006 | 400 | chunkIndex 超出范围 |
| 40007 | 400 | 分片数据为空 |
| 40008 | 400 | MD5 校验失败（数据损坏） |
| 40100 | 401 | 认证失败 |
| 40901 | 409 | 该分片已上传（重复上传） |

**断点续传说明:**

若请求返回 40901（分片已上传），客户端可跳过该分片继续上传下一个分片。

---

### 3.3 查询上传状态

查询当前上传进度，用于断点续传时获取已上传的分片列表。

**请求:**

```
GET /v1/upload/status/:uploadId
```

**Headers:**

| Header | 值 |
|--------|---|
| Authorization | Bearer \<token\> |

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| uploadId | string | 初始化返回的 uploadId |

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "uploadId": "up_a1b2c3d4e5f6",
    "filename": "my_video.mp4",
    "fileSize": 52428800,
    "totalChunks": 25,
    "uploadedChunks": [0, 1, 2, 3, 4, 5],
    "status": "uploading",
    "createdAt": "2026-06-13T10:00:00.000Z",
    "expiresAt": "2026-06-14T10:00:00.000Z"
  },
  "message": "success"
}
```

**响应字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| uploadId | string | 上传任务 ID |
| filename | string | 文件名 |
| fileSize | number | 文件总大小（字节） |
| totalChunks | number | 总分片数 |
| uploadedChunks | number[] | 已上传的分片索引列表 |
| status | string | 上传状态: `uploading` / `completed` / `expired` |
| createdAt | string | 创建时间（ISO 8601） |
| expiresAt | string | 过期时间（ISO 8601） |

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40005 | 400 | uploadId 不存在 |
| 40009 | 400 | 上传任务已过期 |

---

### 3.4 合并分片

所有分片上传完成后，调用此接口合并分片并生成最终文件 URL。

**请求:**

```
POST /v1/upload/merge
```

**Headers:**

| Header | 值 |
|--------|---|
| Content-Type | application/json |
| Authorization | Bearer \<token\> |

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| uploadId | string | 是 | 上传任务 ID |
| filename | string | 是 | 合并后的文件名 |

**请求示例:**

```json
{
  "uploadId": "up_a1b2c3d4e5f6",
  "filename": "my_video.mp4"
}
```

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "uploadId": "up_a1b2c3d4e5f6",
    "videoUrl": "https://oss.example.com/uploads/2026/06/13/my_video_a1b2c3.mp4",
    "fileSize": 52428800,
    "mimeType": "video/mp4",
    "createdAt": "2026-06-13T10:05:00.000Z"
  },
  "message": "success"
}
```

**响应字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| uploadId | string | 上传任务 ID |
| videoUrl | string | 合并后的文件访问 URL（阿里云 OSS 地址） |
| fileSize | number | 最终文件大小（字节） |
| mimeType | string | 文件 MIME 类型 |
| createdAt | string | 合并完成时间（ISO 8601） |

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40001 | 400 | uploadId 或 filename 缺失 |
| 40005 | 400 | uploadId 不存在 |
| 40010 | 400 | 分片尚未全部上传（缺少分片索引列表） |
| 40011 | 400 | 合并失败（文件完整性校验失败） |
| 50002 | 500 | OSS 存储服务异常 |

---

## 4. 任务管理 API

### 4.1 创建处理任务

提交视频处理任务。上传视频获得 `videoUrl` 后调用此接口创建任务。

**请求:**

```
POST /v1/tasks/
```

**Headers:**

| Header | 值 |
|--------|---|
| Content-Type | application/json |
| Authorization | Bearer \<token\> |

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| videoUrl | string | 是 | 视频文件 URL（上传接口返回的地址） |
| taskType | string | 是 | 处理类型: `subtitle` (去字幕) / `icon` (去水印/图标) |
| params | object | 否 | 处理参数，详见 params 说明 |

**params 对象:**

| 字段 | 类型 | 说明 |
|------|------|------|
| subtitleRegion | object | 字幕区域（归一化坐标 0-1），用于去字幕 |
| subtitleRegion.x | number | 区域左上角 X 坐标 (0-1) |
| subtitleRegion.y | number | 区域左上角 Y 坐标 (0-1) |
| subtitleRegion.width | number | 区域宽度 (0-1) |
| subtitleRegion.height | number | 区域高度 (0-1) |
| watermarkRegion | object | 水印区域（归一化坐标 0-1），用于去水印 |
| watermarkRegion.x | number | 区域左上角 X 坐标 (0-1) |
| watermarkRegion.y | number | 区域左上角 Y 坐标 (0-1) |
| watermarkRegion.width | number | 区域宽度 (0-1) |
| watermarkRegion.height | number | 区域高度 (0-1) |
| quality | string | 输出质量: `standard` (标准) / `high` (高清)，VIP 专享高清 |

**请求示例:**

```json
{
  "videoUrl": "https://oss.example.com/uploads/2026/06/13/my_video.mp4",
  "taskType": "subtitle",
  "params": {
    "subtitleRegion": {
      "x": 0,
      "y": 0.9,
      "width": 1,
      "height": 0.1
    },
    "quality": "standard"
  }
}
```

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "id": "task_x1y2z3w4v5u6",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "videoUrl": "https://oss.example.com/uploads/2026/06/13/my_video.mp4",
    "resultUrl": null,
    "status": "pending",
    "taskType": "subtitle",
    "params": {
      "subtitleRegion": {
        "x": 0,
        "y": 0.9,
        "width": 1,
        "height": 0.1
      },
      "quality": "standard"
    },
    "progress": 0,
    "errorMessage": null,
    "retryCount": 0,
    "createdAt": "2026-06-13T10:10:00.000Z",
    "updatedAt": "2026-06-13T10:10:00.000Z",
    "completedAt": null
  },
  "message": "success"
}
```

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40001 | 400 | videoUrl 或 taskType 缺失 |
| 40002 | 400 | videoUrl 格式不合法 |
| 40003 | 400 | taskType 不是 `subtitle` 或 `icon` |
| 40012 | 400 | 区域参数不合法（坐标超出 0-1 范围） |
| 40201 | 402 | 积分不足，无法创建任务 |
| 40301 | 403 | 用户已被禁用 |
| 42901 | 429 | 任务创建频率超限（每分钟最多 5 个） |

---

### 4.2 获取任务详情

查询单个任务的详细状态和进度。

**请求:**

```
GET /v1/tasks/:id
```

**Headers:**

| Header | 值 |
|--------|---|
| Authorization | Bearer \<token\> |

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 任务 ID |

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "id": "task_x1y2z3w4v5u6",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "videoUrl": "https://oss.example.com/uploads/2026/06/13/my_video.mp4",
    "resultUrl": "https://oss.example.com/output/2026/06/13/my_video_processed.mp4",
    "status": "completed",
    "taskType": "subtitle",
    "params": {
      "subtitleRegion": {
        "x": 0,
        "y": 0.9,
        "width": 1,
        "height": 0.1
      },
      "quality": "standard"
    },
    "progress": 100,
    "errorMessage": null,
    "retryCount": 0,
    "createdAt": "2026-06-13T10:10:00.000Z",
    "updatedAt": "2026-06-13T10:15:00.000Z",
    "completedAt": "2026-06-13T10:15:00.000Z"
  },
  "message": "success"
}
```

**任务状态枚举 (status):**

| 状态 | 说明 |
|------|------|
| pending | 等待处理 |
| processing | 处理中 |
| completed | 处理完成 |
| failed | 处理失败 |

**进度说明 (progress):**

| 值 | 说明 |
|---|------|
| 0 | 等待中 |
| 1-99 | 处理进行中（百分比） |
| 100 | 处理完成 |

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40013 | 400 | 任务 ID 格式不合法 |
| 40401 | 404 | 任务不存在 |
| 40302 | 403 | 无权访问该任务（非本人任务） |

---

### 4.3 获取用户任务列表

分页获取当前用户的任务列表，按创建时间倒序排列。

**请求:**

```
GET /v1/tasks/user/:userId
```

**Headers:**

| Header | 值 |
|--------|---|
| Authorization | Bearer \<token\> |

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户 ID |

**Query 参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页数量（最大 100） |
| status | string | 否 | - | 按状态筛选: `pending` / `processing` / `completed` / `failed` |
| taskType | string | 否 | - | 按类型筛选: `subtitle` / `icon` |

**请求示例:**

```
GET /v1/tasks/user/a1b2c3d4?page=1&pageSize=10&status=completed
```

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "task_x1y2z3w4v5u6",
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "videoUrl": "https://oss.example.com/uploads/2026/06/13/video1.mp4",
        "resultUrl": "https://oss.example.com/output/2026/06/13/video1_processed.mp4",
        "status": "completed",
        "taskType": "subtitle",
        "progress": 100,
        "createdAt": "2026-06-13T10:10:00.000Z",
        "completedAt": "2026-06-13T10:15:00.000Z"
      },
      {
        "id": "task_a2b3c4d5e6f7",
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "videoUrl": "https://oss.example.com/uploads/2026/06/12/video2.mp4",
        "resultUrl": "https://oss.example.com/output/2026/06/12/video2_processed.mp4",
        "status": "completed",
        "taskType": "icon",
        "progress": 100,
        "createdAt": "2026-06-12T15:30:00.000Z",
        "completedAt": "2026-06-12T15:35:00.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "pageSize": 10
  },
  "message": "success"
}
```

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40302 | 403 | 无权访问该用户的任务列表 |

---

### 4.4 重试失败任务

对失败的任务进行重新处理。

**请求:**

```
POST /v1/tasks/:id/retry
```

**Headers:**

| Header | 值 |
|--------|---|
| Authorization | Bearer \<token\> |

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 任务 ID |

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "id": "task_x1y2z3w4v5u6",
    "status": "pending",
    "retryCount": 1,
    "progress": 0,
    "errorMessage": null,
    "updatedAt": "2026-06-13T10:20:00.000Z"
  },
  "message": "success"
}
```

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40013 | 400 | 任务 ID 格式不合法 |
| 40401 | 404 | 任务不存在 |
| 40302 | 403 | 无权操作该任务 |
| 40014 | 400 | 任务状态不是 `failed`，无法重试 |
| 40015 | 400 | 重试次数已达上限（最大 3 次） |
| 40201 | 402 | 积分不足 |

---

### 4.5 取消任务

取消等待中或处理中的任务。

**请求:**

```
PUT /v1/tasks/:id/cancel
```

**Headers:**

| Header | 值 |
|--------|---|
| Authorization | Bearer \<token\> |

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 任务 ID |

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "id": "task_x1y2z3w4v5u6",
    "status": "failed",
    "errorMessage": "用户取消任务",
    "updatedAt": "2026-06-13T10:12:00.000Z"
  },
  "message": "success"
}
```

**说明:**

- 取消 `pending` 状态的任务: 直接标记为 `failed`，并退还积分
- 取消 `processing` 状态的任务: 尝试终止阿里云处理进程，标记为 `failed`
- 取消 `completed` / `failed` 状态的任务: 返回错误

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40013 | 400 | 任务 ID 格式不合法 |
| 40401 | 404 | 任务不存在 |
| 40302 | 403 | 无权操作该任务 |
| 40016 | 400 | 任务已完成或已失败，无法取消 |

---

### 4.6 任务实时状态流 (SSE)

通过 Server-Sent Events 实时推送任务状态变化。适用于处理进度页的实时进度展示。

**请求:**

```
GET /v1/tasks/:id/stream
```

**Headers:**

| Header | 值 |
|--------|---|
| Authorization | Bearer \<token\> |
| Accept | text/event-stream |
| Cache-Control | no-cache |

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 任务 ID |

**响应格式:**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**SSE 事件格式:**

每个事件以 `data:` 前缀，事件之间以空行分隔。

```
data: {"taskId":"task_x1y2z3w4v5u6","status":"processing","progress":25,"message":"正在分析视频..."}

data: {"taskId":"task_x1y2z3w4v5u6","status":"processing","progress":50,"message":"正在识别字幕区域..."}

data: {"taskId":"task_x1y2z3w4v5u6","status":"processing","progress":75,"message":"正在去除字幕..."}

data: {"taskId":"task_x1y2z3w4v5u6","status":"completed","progress":100,"resultUrl":"https://oss.example.com/output/processed.mp4","message":"处理完成！"}
```

**SSE 事件数据字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| taskId | string | 任务 ID |
| status | string | 任务状态: `processing` / `completed` / `failed` |
| progress | number | 处理进度 (0-100) |
| message | string | 当前阶段描述信息 |
| resultUrl | string | 处理完成时返回结果文件 URL |
| errorMessage | string | 处理失败时返回错误信息 |

**处理阶段消息 (message):**

| 进度范围 | 消息 |
|----------|------|
| 0-20 | 正在分析视频... |
| 20-40 | 正在识别字幕区域... |
| 40-80 | 正在去除字幕... |
| 80-99 | 正在渲染输出视频... |
| 100 | 处理完成！ |

**客户端实现建议:**

```javascript
// 使用 SSE 监听任务状态
const eventSource = new EventSource('/v1/tasks/task_x1y2z3w4v5u6/stream', {
  headers: { 'Authorization': 'Bearer <token>' }
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`进度: ${data.progress}%, 状态: ${data.status}`);

  if (data.status === 'completed') {
    console.log('结果 URL:', data.resultUrl);
    eventSource.close();
  }

  if (data.status === 'failed') {
    console.error('失败:', data.errorMessage);
    eventSource.close();
  }
};

eventSource.onerror = () => {
  // SSE 连接断开，降级到轮询
  eventSource.close();
  startPolling('task_x1y2z3w4v5u6');
};
```

**降级方案:**

当 SSE 连接失败时，客户端应降级到轮询接口:

```
GET /v1/tasks/:id
```

建议轮询间隔: 3 秒

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40401 | 404 | 任务不存在 |
| 40302 | 403 | 无权访问该任务 |

---

## 5. 阿里云接口 API

以下接口供后端内部调用，用于与阿里云 MPS (媒体处理服务) 交互。前端不应直接调用这些接口。

### 5.1 提交处理任务到阿里云

将视频处理任务提交到阿里云 MPS 进行处理。

**请求:**

```
POST /v1/aliyun/submit-job
```

**Headers:**

| Header | 值 |
|--------|---|
| Content-Type | application/json |
| Authorization | Bearer \<token\> |

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| videoUrl | string | 是 | 待处理视频的 OSS 地址 |
| processType | string | 是 | 处理类型: `subtitle` / `icon` |
| params | object | 否 | 处理参数 |
| params.subtitleRegion | object | 否 | 字幕区域（归一化坐标） |
| params.watermarkRegion | object | 否 | 水印区域（归一化坐标） |
| config | object | 否 | 阿里云配置覆盖 |
| config.region | string | 否 | 阿里云区域，默认 `cn-hangzhou` |
| config.inputBucket | string | 否 | 输入 Bucket |
| config.outputBucket | string | 否 | 输出 Bucket |

**请求示例:**

```json
{
  "videoUrl": "uploads/2026/06/13/my_video.mp4",
  "processType": "subtitle",
  "params": {
    "subtitleRegion": {
      "x": 0,
      "y": 0.9,
      "width": 1,
      "height": 0.1
    }
  },
  "config": {
    "region": "cn-hangzhou",
    "inputBucket": "video-remover-input",
    "outputBucket": "video-remover-output"
  }
}
```

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "jobId": "mps-job-28a73f9b1c4e",
    "requestId": "E465AB35-4128-4E4B-B95A-5B0A1E3B5F7C",
    "status": "Submitted",
    "createdAt": "2026-06-13T10:10:05.000Z"
  },
  "message": "success"
}
```

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40001 | 400 | videoUrl 或 processType 缺失 |
| 50003 | 500 | 阿里云 API 调用失败 |
| 50004 | 500 | 阿里云配额不足 |

---

### 5.2 查询阿里云任务状态

查询已提交到阿里云的处理任务状态。

**请求:**

```
GET /v1/aliyun/query-job/:jobId
```

**Headers:**

| Header | 值 |
|--------|---|
| Authorization | Bearer \<token\> |

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| jobId | string | 阿里云 MPS 任务 ID |

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "jobId": "mps-job-28a73f9b1c4e",
    "status": "Success",
    "progress": 100,
    "inputUrl": "https://video-remover-input.oss-cn-hangzhou.aliyuncs.com/uploads/2026/06/13/my_video.mp4",
    "outputUrl": "https://video-remover-output.oss-cn-hangzhou.aliyuncs.com/output/2026/06/13/my_video_processed.mp4",
    "errorMessage": null,
    "createdAt": "2026-06-13T10:10:05.000Z",
    "completedAt": "2026-06-13T10:14:30.000Z"
  },
  "message": "success"
}
```

**阿里云任务状态枚举 (status):**

| 状态 | 说明 |
|------|------|
| Submitted | 已提交，等待处理 |
| Processing | 处理中 |
| Success | 处理成功 |
| Fail | 处理失败 |

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40013 | 400 | jobId 格式不合法 |
| 40402 | 404 | 阿里云任务不存在 |
| 50003 | 500 | 阿里云 API 查询失败 |

---

### 5.3 阿里云任务完成回调

阿里云 MPS 在任务处理完成（成功或失败）时主动回调此接口。

**请求:**

```
POST /v1/aliyun/callback
```

**Headers:**

| Header | 值 |
|--------|---|
| Content-Type | application/json |
| X-Aliyun-Signature | string (阿里云回调签名，用于验证来源) |

**请求体:**

```json
{
  "jobId": "mps-job-28a73f9b1c4e",
  "status": "Success",
  "outputUrl": "https://video-remover-output.oss-cn-hangzhou.aliyuncs.com/output/2026/06/13/my_video_processed.mp4",
  "errorMessage": null,
  "duration": 265,
  "requestId": "E465AB35-4128-4E4B-B95A-5B0A1E3B5F7C"
}
```

**请求体字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| jobId | string | 是 | 阿里云任务 ID |
| status | string | 是 | 任务状态: `Success` / `Fail` |
| outputUrl | string | 否 | 处理结果文件 URL（成功时返回） |
| errorMessage | string | 否 | 错误信息（失败时返回） |
| duration | number | 否 | 处理耗时（秒） |
| requestId | string | 否 | 阿里云请求 ID |

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "received": true
  },
  "message": "success"
}
```

**回调处理逻辑:**

1. 验证回调签名（X-Aliyun-Signature）
2. 根据 `jobId` 查找对应的任务记录
3. 若 `status` 为 `Success`:
   - 更新任务状态为 `completed`
   - 设置 `resultUrl` 为 `outputUrl`
   - 更新 `completedAt` 时间
   - 触发 SSE 事件推送给前端
4. 若 `status` 为 `Fail`:
   - 更新任务状态为 `failed`
   - 设置 `errorMessage`
   - 触发 SSE 事件推送给前端

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40001 | 400 | jobId 或 status 缺失 |
| 40104 | 401 | 回调签名验证失败 |
| 40402 | 404 | 任务记录不存在 |
| 50005 | 500 | 回调处理异常 |

---

## 6. 订单 API

### 6.1 创建订单

创建积分充值或套餐购买订单。

**请求:**

```
POST /v1/orders/create
```

**Headers:**

| Header | 值 |
|--------|---|
| Content-Type | application/json |
| Authorization | Bearer \<token\> |

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderType | string | 是 | 订单类型: `credits` (积分充值) / `vip` (会员套餐) |
| planId | string | 是 | 套餐 ID |
| platform | string | 否 | 支付平台: `wechat` / `alipay`，默认 `wechat` |

**套餐 planId 对照表:**

| planId | 类型 | 名称 | 价格 (元) | 积分/权益 |
|--------|------|------|-----------|-----------|
| credits_100 | credits | 100 积分 | 9.9 | 100 积分 |
| credits_500 | credits | 500 积分 | 39.9 | 500 积分 |
| credits_1000 | credits | 1000 积分 | 69.9 | 1000 积分 |
| vip_monthly | vip | 月卡 | 19.9 | 无限次处理 30 天 |
| vip_quarterly | vip | 季卡 | 49.9 | 无限次处理 90 天 |
| vip_yearly | vip | 年卡 | 169.9 | 无限次处理 365 天 |

**请求示例:**

```json
{
  "orderType": "credits",
  "planId": "credits_500",
  "platform": "wechat"
}
```

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "id": "order_m1n2o3p4q5r6",
    "orderNo": "20260613101000000001",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "orderType": "credits",
    "planId": "credits_500",
    "amount": 39.9,
    "credits": 500,
    "platform": "wechat",
    "status": "unpaid",
    "payParams": {
      "appId": "wx1234567890abcdef",
      "timeStamp": "1686651000",
      "nonceStr": "5K8264ILTKCH16CQ2502SI8ZNMTM67VS",
      "package": "prepay_id=wx20260613101000abcdef",
      "signType": "RSA",
      "paySign": "oR9d8PuhnIc+YZ8cB..."
    },
    "createdAt": "2026-06-13T10:10:00.000Z",
    "expireAt": "2026-06-13T10:25:00.000Z"
  },
  "message": "success"
}
```

**响应字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 订单 ID |
| orderNo | string | 订单编号（唯一） |
| amount | number | 订单金额（元） |
| credits | number | 充值积分数量 |
| status | string | 订单状态: `unpaid` / `paid` / `cancelled` / `refunded` |
| payParams | object | 微信/支付宝支付参数，用于客户端拉起支付 |
| expireAt | string | 订单过期时间（未支付自动关闭，15 分钟） |

**payParams 字段（微信支付）:**

| 字段 | 类型 | 说明 |
|------|------|------|
| appId | string | 小程序 AppID |
| timeStamp | string | 时间戳 |
| nonceStr | string | 随机字符串 |
| package | string | 统一下单接口返回的 prepay_id |
| signType | string | 签名类型 |
| paySign | string | 签名 |

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40001 | 400 | orderType 或 planId 缺失 |
| 40017 | 400 | planId 不存在或已下架 |
| 40018 | 400 | 存在未支付订单，请先完成支付或等待过期 |
| 40301 | 403 | 用户已被禁用 |

---

### 6.2 获取订单详情

查询订单详细信息。

**请求:**

```
GET /v1/orders/:id
```

**Headers:**

| Header | 值 |
|--------|---|
| Authorization | Bearer \<token\> |

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 订单 ID |

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "id": "order_m1n2o3p4q5r6",
    "orderNo": "20260613101000000001",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "orderType": "credits",
    "planId": "credits_500",
    "amount": 39.9,
    "credits": 500,
    "platform": "wechat",
    "status": "paid",
    "payTime": "2026-06-13T10:12:30.000Z",
    "thirdPartyOrderNo": "4200001833202606131234567890",
    "createdAt": "2026-06-13T10:10:00.000Z",
    "updatedAt": "2026-06-13T10:12:30.000Z"
  },
  "message": "success"
}
```

**订单状态枚举 (status):**

| 状态 | 说明 |
|------|------|
| unpaid | 待支付 |
| paid | 已支付 |
| cancelled | 已取消（超时或用户取消） |
| refunded | 已退款 |

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40013 | 400 | 订单 ID 格式不合法 |
| 40403 | 404 | 订单不存在 |
| 40302 | 403 | 无权访问该订单 |

---

### 6.3 订单支付

客户端拉起支付后，调用此接口确认支付结果。通常由微信/支付宝支付回调自动处理，此接口用于客户端主动查询和确认。

**请求:**

```
POST /v1/orders/:id/pay
```

**Headers:**

| Header | 值 |
|--------|---|
| Content-Type | application/json |
| Authorization | Bearer \<token\> |

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 订单 ID |

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| payResult | object | 否 | 客户端支付结果（微信/支付宝返回） |
| payResult.transactionId | string | 否 | 微信支付交易单号 |
| payResult.tradeNo | string | 否 | 支付宝交易号 |

**请求示例:**

```json
{
  "payResult": {
    "transactionId": "4200001833202606131234567890"
  }
}
```

**成功响应 (200):**

```json
{
  "code": 0,
  "data": {
    "id": "order_m1n2o3p4q5r6",
    "status": "paid",
    "payTime": "2026-06-13T10:12:30.000Z",
    "creditsAdded": 500,
    "currentBalance": 530
  },
  "message": "success"
}
```

**响应字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 订单 ID |
| status | string | 支付后的订单状态 |
| payTime | string | 支付时间 |
| creditsAdded | number | 本次充值获得的积分 |
| currentBalance | number | 当前账户积分余额 |

**错误场景:**

| code | HTTP Status | 说明 |
|------|-------------|------|
| 40013 | 400 | 订单 ID 格式不合法 |
| 40403 | 404 | 订单不存在 |
| 40302 | 403 | 无权操作该订单 |
| 40019 | 400 | 订单状态不是 `unpaid`，无法支付 |
| 40020 | 400 | 订单已过期 |
| 40021 | 400 | 支付结果验证失败 |
| 50006 | 500 | 支付系统异常 |

---

## 7. 错误码定义

### 7.1 通用错误码

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| 0 | 200 | 成功 |
| 40001 | 400 | 参数错误（缺少必填参数或格式不合法） |
| 40002 | 400 | 文件大小超过限制 |
| 40003 | 400 | 不支持的文件类型 |
| 40004 | 400 | 参数值不合法（超出允许范围） |
| 40100 | 401 | 未认证（缺少 Authorization 头） |
| 40101 | 401 | 登录凭证无效或已过期 |
| 40102 | 401 | refresh_token 已过期 |
| 40103 | 401 | refresh_token 无效（可能被盗用） |
| 40104 | 401 | 签名验证失败 |
| 40301 | 403 | 用户已被禁用 |
| 40302 | 403 | 无权访问该资源 |
| 40401 | 404 | 资源不存在（通用） |
| 42900 | 429 | 请求频率超限（通用） |
| 50000 | 500 | 服务器内部错误 |
| 50001 | 500 | 第三方服务异常（微信/支付宝） |
| 50002 | 500 | OSS 存储服务异常 |

### 7.2 业务错误码

#### 文件上传相关 (4000x)

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| 40005 | 400 | uploadId 不存在或已过期 |
| 40006 | 400 | chunkIndex 超出范围 |
| 40007 | 400 | 分片数据为空 |
| 40008 | 400 | MD5 校验失败 |
| 40009 | 400 | 上传任务已过期 |
| 40010 | 400 | 分片尚未全部上传 |
| 40011 | 400 | 文件合并失败 |

#### 任务管理相关 (4001x)

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| 40012 | 400 | 区域参数不合法 |
| 40013 | 400 | ID 格式不合法 |
| 40014 | 400 | 任务状态不允许此操作 |
| 40015 | 400 | 重试次数已达上限 |
| 40016 | 400 | 任务已完成或已失败，无法取消 |

#### 订单相关 (4001x - 4002x)

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| 40017 | 400 | 套餐不存在或已下架 |
| 40018 | 400 | 存在未支付订单 |
| 40019 | 400 | 订单状态不允许支付 |
| 40020 | 400 | 订单已过期 |
| 40021 | 400 | 支付结果验证失败 |

#### 支付相关 (4020x)

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| 40201 | 402 | 积分不足 |

#### 限流相关 (4290x)

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| 42901 | 429 | 任务创建频率超限 |

#### 阿里云相关 (5000x)

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| 50003 | 500 | 阿里云 API 调用失败 |
| 50004 | 500 | 阿里云配额不足 |
| 50005 | 500 | 回调处理异常 |
| 50006 | 500 | 支付系统异常 |

### 7.3 错误响应统一格式

所有错误响应均遵循统一格式:

```json
{
  "code": 40001,
  "data": null,
  "message": "参数错误: filename 不能为空",
  "details": {
    "field": "filename",
    "constraint": "required"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 业务错误码 |
| data | null | 错误时固定为 null |
| message | string | 人类可读的错误描述 |
| details | object | 可选，错误详情（用于开发调试） |

---

## 附录

### A. 数据模型

#### Task 对象

```typescript
interface Task {
  id: string;                    // 任务 ID (UUID)
  userId: string;                // 用户 ID
  videoUrl: string;              // 原始视频 URL
  resultUrl: string | null;      // 处理结果 URL
  status: TaskStatus;            // 任务状态
  taskType: TaskType;            // 处理类型
  params: Record<string, any>;   // 处理参数
  progress: number;              // 处理进度 (0-100)
  errorMessage: string | null;   // 错误信息
  retryCount: number;            // 重试次数
  createdAt: string;             // 创建时间 (ISO 8601)
  updatedAt: string;             // 更新时间 (ISO 8601)
  completedAt: string | null;    // 完成时间 (ISO 8601)
}

type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
type TaskType = 'subtitle' | 'icon';
```

#### User 对象

```typescript
interface User {
  id: string;                    // 用户 ID (UUID)
  openid: string;                // 小程序 openid
  nickname: string;              // 用户昵称
  avatarUrl: string;             // 头像 URL
  balance: number;               // 积分余额
  vipType: VipType;              // VIP 类型
  vipExpireAt: string | null;    // VIP 过期时间
  createdAt: string;             // 注册时间 (ISO 8601)
}

type VipType = 'none' | 'monthly' | 'quarterly' | 'yearly';
```

#### Order 对象

```typescript
interface Order {
  id: string;                    // 订单 ID (UUID)
  orderNo: string;               // 订单编号
  userId: string;                // 用户 ID
  orderType: OrderType;          // 订单类型
  planId: string;                // 套餐 ID
  amount: number;                // 金额（元）
  credits: number;               // 积分数量
  platform: PayPlatform;         // 支付平台
  status: OrderStatus;           // 订单状态
  payTime: string | null;        // 支付时间
  thirdPartyOrderNo: string | null; // 第三方交易单号
  createdAt: string;             // 创建时间 (ISO 8601)
  updatedAt: string;             // 更新时间 (ISO 8601)
}

type OrderType = 'credits' | 'vip';
type PayPlatform = 'wechat' | 'alipay';
type OrderStatus = 'unpaid' | 'paid' | 'cancelled' | 'refunded';
```

### B. 任务状态机

```
                    +---------+
                    | pending |
                    +----+----+
                         |
                         v
                    +----+----+
           +------->|processing|<-------+
           |        +----+----+        |
           |             |             |
           |        +----+----+        |
           |        |         |        |
           |        v         v        |
           |  +-----+--+ +---+----+   |
           |  |completed| | failed |   |
           |  +---------+ +---+----+   |
           |                     |     |
           |              (retry)      |
           |                     |     |
           +---------------------+-----+
```

### C. 认证流程图

```
客户端                          服务端
  |                               |
  |-- wx.login() -->              |
  |   (获取 code)                 |
  |                               |
  |-- POST /v1/auth/login -------->|
  |   { code }                    |
  |                               |-- 请求微信 API 换取 openid
  |                               |-- 创建/查找用户
  |                               |-- 生成 JWT Token
  |<-- 200 { token, user } -------|
  |                               |
  |-- GET /v1/tasks (Bearer token) ->|
  |                               |-- 验证 JWT
  |                               |-- 返回数据
  |<-- 200 { data } --------------|
  |                               |
  |-- (token 过期)                |
  |                               |
  |-- POST /v1/auth/refresh ------>|
  |   { refresh_token }           |
  |                               |-- 验证 refresh_token
  |                               |-- 生成新 Token 对
  |<-- 200 { new tokens } --------|
```

### D. 分片上传流程图

```
客户端                          服务端                       OSS
  |                               |                          |
  |-- POST /upload/init -------->|                          |
  |   { filename, fileSize }      |                          |
  |<-- { uploadId, totalChunks } -|                          |
  |                               |                          |
  |-- POST /upload/chunk 0 ------>|                          |
  |   (binary data)               |-- 存储到临时目录 ------->|
  |<-- { chunkIndex: 0 } ---------|                          |
  |                               |                          |
  |-- POST /upload/chunk 1 ------>|                          |
  |   (binary data)               |-- 存储到临时目录 ------->|
  |<-- { chunkIndex: 1 } ---------|                          |
  |                               |                          |
  |    ... (所有分片)             |                          |
  |                               |                          |
  |-- POST /upload/merge -------->|                          |
  |   { uploadId, filename }      |-- 合并分片               |
  |                               |-- 上传到 OSS ----------->|
  |<-- { videoUrl } --------------|                          |
  |                               |                          |
  |-- POST /tasks/create -------->|                          |
  |   { videoUrl, taskType }      |-- 提交到阿里云 MPS ----->|
  |<-- { taskId, status } --------|                          |
```

---

**文档版本:** v1.0.0
**最后更新:** 2026-06-13
**编码:** UTF-8
