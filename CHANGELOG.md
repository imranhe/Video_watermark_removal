# 版本变更记录

本项目的所有重要变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

---

## [未发布]

### 新增
- 数据库表分区策略文档
- 乐观锁实现指南
- 软删除最佳实践
- App Store审核指南

### 改进
- 优化API接口文档结构
- 完善故障排除指南

---

## [0.2.0] - 2026-06-13

### 新增
- **多智能体开发系统**：3个智能体并行工作，效率提升3x
- **完整数据结构**：5个TypeScript类型文件 + 10个数据库表
- **开发文档体系**：20+个文档，5000+行内容
- **合规文档**：隐私政策、用户协议、第三方清单等
- **文档审核报告**：详细的文档质量评估

### 文档
- `docs/api-reference.md` - 900+行，22个API端点
- `docs/components.md` - 646行，覆盖所有组件
- `docs/data-dictionary.md` - 10个表，字段级说明
- `docs/troubleshooting.md` - 832行，50+故障场景
- `docs/wechat-mini-program-compliance.md` - 合规审核报告
- `docs/documentation-review-report.md` - 文档审核报告

### 改进
- 优化数据库索引策略
- 完善错误处理机制
- 统一类型定义

### 修复
- 修复类型不一致问题
- 更新init.sql添加管理表

---

## [0.1.0] - 2026-06-12

### 新增
- **项目初始化**：uni-app + Vue3 + TypeScript 项目结构
- **基础架构**：
  - 网络请求封装 (`src/api/request.ts`)
  - 状态管理 (Pinia)
  - 路由配置
  - 类型定义 (`src/types/`)
- **核心组件**：
  - `VideoUploader` - 视频上传组件
  - `TaskStatus` - 任务状态组件
- **页面开发**：
  - 首页 (`src/pages/index/`)
  - 上传页 (`src/pages/upload/`)
- **API接口**：
  - 阿里云视频处理API
  - 任务管理API
- **数据库设计**：
  - `database/init.sql` - 4个业务表
- **部署配置**：
  - `Dockerfile` - Docker镜像构建
  - `docker-compose.yml` - 容器编排
  - `nginx.conf` - Nginx配置
- **Claude Code配置**：
  - `CLAUDE.md` - 开发规范
  - `.agents/skills/` - 技能配置

### 文档
- `README.md` - 项目介绍
- `QUICKSTART.md` - 快速开始
- `PROJECT_STATUS.md` - 项目状态
- `BACKEND_ARCHITECTURE.md` - 后端架构

---

## 版本说明

### 版本号规则

- **主版本号 (MAJOR)**：不兼容的API变更
- **次版本号 (MINOR)**：向下兼容的功能性新增
- **修订号 (PATCH)**：向下兼容的问题修正

### 变更类型

- **新增 (Added)**：新功能
- **变更 (Changed)**：现有功能的变更
- **弃用 (Deprecated)**：即将移除的功能
- **移除 (Removed)**：已移除的功能
- **修复 (Fixed)**：Bug修复
- **安全 (Security)**：安全相关的变更

---

## 链接

- [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)
- [语义化版本控制](https://semver.org/lang/zh-CN/)
- [GitHub Releases](https://github.com/sypw233/video-subtitle-remover/releases)
