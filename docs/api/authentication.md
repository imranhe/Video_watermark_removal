# Authentication

Authentication and authorization documentation.

---

## Table of Contents

- [Overview](#overview)
- [Login Flow](#login-flow)
- [WeChat Login](#wechat-login)
- [Alipay Login](#alipay-login)
- [Token Management](#token-management)
- [API Endpoints](#api-endpoints)

---

## Overview

The application supports WeChat and Alipay Mini Program authentication using OAuth 2.0.

---

## Login Flow

1. User opens Mini Program
2. Mini Program calls `wx.login()` / `my.getAuthCode()`
3. Frontend sends code to backend
4. Backend exchanges code for openid/session_key via platform API
5. Backend generates JWT token
6. Frontend stores token for subsequent requests

---

## WeChat Login

```typescript
// Frontend
const { code } = await wx.login()
const res = await api.auth.wechatLogin({ code })
// res.data.token contains JWT
```

---

## Alipay Login

```typescript
// Frontend
const { authCode } = await my.getAuthCode()
const res = await api.auth.alipayLogin({ authCode })
// res.data.token contains JWT
```

---

## Token Management

- Token type: JWT (JSON Web Token)
- Expiration: 7 days
- Refresh: Re-login required after expiration
- Storage: `uni.setStorageSync('token', token)`

---

## API Endpoints

### WeChat Login

```
POST /v1/auth/wechat-login
```

**Request:**

```json
{
  "code": "wx_login_code"
}
```

**Response:**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "nickname": "User",
      "avatar": "https://..."
    }
  }
}
```

### Alipay Login

```
POST /v1/auth/alipay-login
```

**Request:**

```json
{
  "authCode": "alipay_auth_code"
}
```

**Response:** Same as WeChat Login.

---

*Last updated: 2026-06-15*
