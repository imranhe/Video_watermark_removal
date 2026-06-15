# [API Name]

Brief description of the API and its purpose.

---

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Endpoint 1](#endpoint-1)
  - [Endpoint 2](#endpoint-2)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)

---

## Base URL

```
Development: http://localhost:3000/v1
Production:  https://api.example.com/v1
```

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Obtain a token via the [login endpoint](#login).

---

## Endpoints

### Endpoint 1

Brief description of what this endpoint does.

**Request**

```
POST /v1/resource
```

**Headers**

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |
| Content-Type | string | Yes | `application/json` |

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| field1 | string | Yes | Description of field1 |
| field2 | number | No | Description of field2, default: 0 |
| field3 | object | No | Description of field3 |

**Request Example**

```json
{
  "field1": "value1",
  "field2": 100,
  "field3": {
    "nested_field": "value"
  }
}
```

**Response**

**Success (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "12345",
    "field1": "value1",
    "field2": 100,
    "createdAt": "2026-06-15T10:00:00Z"
  }
}
```

**Error (400)**

```json
{
  "code": 40001,
  "message": "field1 is required",
  "data": null
}
```

---

### Endpoint 2

Brief description.

**Request**

```
GET /v1/resource/:id
```

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Resource ID |

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fields | string | No | Comma-separated field names to return |
| include | string | No | Related resources to include |

**Response**

**Success (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "12345",
    "field1": "value1"
  }
}
```

**Error (404)**

```json
{
  "code": 40401,
  "message": "Resource not found",
  "data": null
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| 0 | 200 | Success |
| 40001 | 400 | Bad request - missing required field |
| 40002 | 400 | Bad request - invalid field format |
| 40101 | 401 | Unauthorized - token missing or expired |
| 40301 | 403 | Forbidden - insufficient permissions |
| 40401 | 404 | Not found |
| 50001 | 500 | Internal server error |

---

## Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public | 60 requests | 1 minute |
| Authenticated | 120 requests | 1 minute |
| Upload | 10 requests | 1 minute |

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
X-RateLimit-Reset: 1623849600
```

---

*Last updated: YYYY-MM-DD*
