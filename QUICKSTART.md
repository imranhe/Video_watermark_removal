# 快速启动指南

## 开发模式（推荐新手）

开发模式跳过数据库和第三方服务，使用内存存储，5分钟内即可看到效果。

### 启动步骤

#### 1. 启动后端（开发模式）
```bash
cd server
npm run dev:quick
```

后端将在 http://localhost:3000 启动，无需数据库配置。

#### 2. 启动前端
```bash
# 新开一个终端
cd ..
npm run dev:mp-weixin
```

#### 3. 导入微信开发者工具
- 路径: `/Volumes/DataDisk/Code/Video_watermark_removal/dist/dev/mp-weixin`
- AppID: `wx9f912775c8453390`

### 开发模式特性

- ✅ 无需 MySQL 数据库
- ✅ 无需 Redis
- ✅ 无需阿里云配置
- ✅ 无需微信支付配置
- ✅ 内存存储（重启后数据重置）
- ✅ 模拟视频处理（3秒完成）
- ✅ 测试用户已创建（1000积分）

### 测试账号

- 用户ID: `user-1`
- 昵称: 测试用户
- 积分: 1000

### API 测试

```bash
# 健康检查
curl http://localhost:3000/health

# 用户登录
curl -X POST http://localhost:3000/v1/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'

# 查看用户信息
curl http://localhost:3000/v1/user/profile

# 创建任务（上传视频）
curl -X POST http://localhost:3000/v1/tasks \
  -F "video=@/path/to/video.mp4" \
  -F "type=subtitle"

# 查看任务列表
curl http://localhost:3000/v1/tasks

# 查看任务进度
curl http://localhost:3000/v1/tasks/task-xxx/progress

# 查看套餐
curl http://localhost:3000/v1/packages

# 查看积分
curl http://localhost:3000/v1/points/balance
```

---

## 完整模式（生产环境）

需要配置真实的数据库和第三方服务。

### 前置要求

1. **MySQL 8.0+**
2. **Redis 6.0+**
3. **微信小程序 AppID**（已有）
4. **阿里云账号**（需要申请）
5. **微信支付商户号**（需要申请）

### 启动步骤

#### 1. 配置环境变量
```bash
cd server
cp .env.example .env
# 编辑 .env，填入真实配置
```

#### 2. 初始化数据库
```bash
mysql -u root -p < ../database/init.sql
```

#### 3. 启动服务
```bash
# 启动 Redis
redis-server

# 启动后端
npm run dev

# 启动前端（新终端）
cd ..
npm run dev:mp-weixin
```

---

## 常见问题

### Q: 后端启动报错 "Cannot find module"
```bash
cd server
npm install
```

### Q: 前端启动报错
```bash
cd ..
npm install
npm run dev:mp-weixin
```

### Q: 微信开发者工具找不到 app.json
确保导入路径正确：
```
/Volumes/DataDisk/Code/Video_watermark_removal/dist/dev/mp-weixin
```

### Q: API 请求失败
检查后端是否启动：
```bash
curl http://localhost:3000/health
```

---

## 下一步

开发模式验证通过后，可以：

1. **完善前端功能** - 实现所有页面交互
2. **集成第三方服务** - 配置阿里云和微信支付
3. **添加测试** - 编写单元测试和集成测试
4. **优化性能** - 添加缓存和数据库优化
5. **部署上线** - 配置生产环境

---

*最后更新: 2026-06-16*
