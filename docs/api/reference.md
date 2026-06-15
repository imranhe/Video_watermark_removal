# API Reference

Complete API reference for the Video Subtitle Removal backend service.

---

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Common Response Format](#common-response-format)
- [Error Codes](#error-codes)
- [API Modules](#api-modules)
- [Rate Limiting](#rate-limiting)

---

## Base URL

```
Development: http://localhost:3000/v1
Production:  https://api.example.com/v1
```

---

## Authentication

All authenticated endpoints require a Bearer token:

```
Authorization: Bearer <jwt_token>
```

Obtain a token via the login endpoint. See [Authentication](./authentication.md) for details.

---

## Common Response Format

### Success

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### Error

```json
{
  "code": 40001,
  "message": "Error description",
  "data": null
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| 0 | 200 | Success |
| 40001 | 400 | Bad request - missing required field |
| 40002 | 400 | Bad request - invalid format |
| 40101 | 401 | Unauthorized |
| 40301 | 403 | Forbidden |
| 40401 | 404 | Not found |
| 42901 | 429 | Rate limit exceeded |
| 50001 | 500 | Internal server error |

---

## API Modules

| Module | Prefix | Description |
|--------|--------|-------------|
| [Endpoints](./endpoints.md) | `/v1` | Full endpoint listing |
| [Authentication](./authentication.md) | `/v1/auth` | Login, register, token refresh |

---

## Rate Limiting

| Type | Limit | Window |
|------|-------|--------|
| Public | 60 req/min | 1 minute |
| Authenticated | 120 req/min | 1 minute |
| Upload | 10 req/min | 1 minute |

---

*Last updated: 2026-06-15*
