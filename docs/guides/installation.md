# Installation Guide

Detailed installation instructions for all supported platforms.

---

## Table of Contents

- [System Requirements](#system-requirements)
- [Node.js Installation](#nodejs-installation)
- [Project Setup](#project-setup)
- [Database Setup](#database-setup)
- [Docker Installation](#docker-installation)
- [Platform-Specific Notes](#platform-specific-notes)

---

## System Requirements

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | 16.0.0 |
| npm | 8.0.0 |
| Git | 2.0.0 |
| MySQL | 5.7.44 |
| Docker (optional) | 20.10.0 |
| Docker Compose (optional) | 2.0.0 |

---

## Node.js Installation

### macOS

```bash
# Using Homebrew
brew install node@18

# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Linux

```bash
# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### Windows

Download and install from [nodejs.org](https://nodejs.org/).

---

## Project Setup

```bash
# 1. Clone repository
git clone https://github.com/sypw233/video-subtitle-remover.git
cd video-subtitle-remover

# 2. Install dependencies
npm install

# 3. Copy environment config
cp .env.example .env.local

# 4. Edit .env.local with your settings
# See .env.example for all available options
```

---

## Database Setup

### Using Docker (Recommended)

```bash
docker-compose up -d mysql
```

### Manual Installation

1. Install MySQL 5.7.44+
2. Create database:

```sql
CREATE DATABASE video_remover CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Run initialization script:

```bash
mysql -u root -p video_remover < database/init.sql
```

---

## Docker Installation

```bash
# Build and start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Platform-Specific Notes

### WeChat Mini Program

- Install WeChat Developer Tools from [developers.weixin.qq.com](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- Configure AppID in `manifest.json`

### Alipay Mini Program

- Install Alipay Developer Tools
- Configure AppID in `manifest.json`

---

*Last updated: 2026-06-15*
