# Getting Started

Guide to setting up the Video Subtitle Removal Mini-Program development environment.

**Audience**: All developers
**Estimated time**: 15 minutes
**Difficulty**: Beginner

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Next Steps](#next-steps)

---

## Overview

This guide walks you through setting up the development environment for the Video Subtitle Removal Mini-Program. After completing this guide, you will have a working local development environment.

---

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js >= 16.0.0 installed
- [ ] npm >= 8.0.0 installed
- [ ] Git >= 2.0.0 installed
- [ ] WeChat Developer Tools (for WeChat Mini Program development)
- [ ] Docker (optional, for containerized development)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sypw233/video-subtitle-remover.git
cd video-subtitle-remover
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Backend service
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=video_remover

# JWT
JWT_SECRET=your_jwt_secret

# Aliyun
ALIYUN_ACCESS_KEY=your_access_key
ALIYUN_SECRET_KEY=your_secret_key
```

---

## Configuration

### Database Setup

```bash
# Using Docker
docker-compose up -d mysql

# Or install MySQL 5.7+ manually and run:
mysql -u root -p < database/init.sql
```

### WeChat Mini Program

1. Open WeChat Developer Tools
2. Import project from `dist/dev/mp-weixin`
3. Configure AppID in `manifest.json`

---

## Running the App

### H5 Development

```bash
npm run dev:h5
# Open http://localhost:5173
```

### WeChat Mini Program

```bash
npm run dev:mp-weixin
# Open in WeChat Developer Tools
```

### Alipay Mini Program

```bash
npm run dev:mp-alipay
# Open in Alipay Developer Tools
```

### Full Stack with Docker

```bash
docker-compose up -d
# H5: http://localhost
# API: http://localhost:3000
# MySQL: localhost:3306
```

---

## Next Steps

- [Component Overview](../components/overview.md) - Learn about UI components
- [API Reference](../api/reference.md) - Explore the API
- [Coding Standards](../development/coding-standards.md) - Development conventions
- [Deployment Guide](./deployment.md) - Deploy to production

---

*Last updated: 2026-06-15*
