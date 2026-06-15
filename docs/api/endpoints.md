# API Endpoints

Complete listing of all API endpoints.

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Tasks](#tasks)
- [Orders](#orders)
- [Health](#health)

---

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/auth/wechat-login` | No | WeChat login |
| POST | `/v1/auth/alipay-login` | No | Alipay login |

---

## Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/users/profile` | Yes | Get current user profile |
| PUT | `/v1/users/profile` | Yes | Update user profile |
| GET | `/v1/users/points` | Yes | Get user points balance |

---

## Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/tasks` | Yes | Create a new task |
| GET | `/v1/tasks` | Yes | List user tasks |
| GET | `/v1/tasks/:id` | Yes | Get task details |
| GET | `/v1/tasks/:id/status` | Yes | Get task processing status |
| DELETE | `/v1/tasks/:id` | Yes | Cancel/delete a task |

---

## Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/orders` | Yes | Create a new order |
| GET | `/v1/orders` | Yes | List user orders |
| GET | `/v1/orders/:id` | Yes | Get order details |
| POST | `/v1/orders/:id/callback` | No | Payment callback |

---

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/health` | No | Health check |

---

*Last updated: 2026-06-15*
