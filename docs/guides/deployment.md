# Deployment Guide

Production deployment instructions for the Video Subtitle Removal Mini-Program.

**Audience**: DevOps / Backend developers
**Estimated time**: 30 minutes
**Difficulty**: Intermediate

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Nginx Configuration](#nginx-configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers deploying the application to a production environment using Docker or manual setup.

---

## Prerequisites

- Server with Linux (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name configured (for SSL)
- Aliyun API credentials configured

---

## Docker Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/sypw233/video-subtitle-remover.git
cd video-subtitle-remover
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with production values
```

### 3. Build and Deploy

```bash
docker-compose -f docker-compose.yml up -d --build
```

### 4. Verify

```bash
docker-compose ps
curl http://localhost:3000/health
```

---

## Manual Deployment

### 1. Build Frontend

```bash
npm run build:h5
```

### 2. Setup Backend

```bash
cd server
npm install --production
```

### 3. Start Services

```bash
# Using PM2
npm install -g pm2
pm2 start server/index.js --name video-remover-api
pm2 save
pm2 startup
```

---

## Nginx Configuration

See `nginx.conf` in the project root. Key settings:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    location /v1/ {
        proxy_pass http://localhost:3000;
    }
}
```

---

## SSL/TLS Setup

```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Monitoring

- Check logs: `docker-compose logs -f`
- Health endpoint: `GET /v1/health`
- PM2 monitoring: `pm2 monit`

---

## Troubleshooting

### Service fails to start

Check logs: `docker-compose logs service-name`

### Database connection refused

Verify MySQL is running: `docker-compose ps mysql`

---

*Last updated: 2026-06-15*
