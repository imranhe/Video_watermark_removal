# 贡献指南

感谢您对本项目的关注！我们欢迎任何形式的贡献。

---

## 如何贡献

### 1. 报告Bug

如果您发现了Bug，请通过 [GitHub Issues](https://github.com/sypw233/video-subtitle-remover/issues) 提交，并包含：

- **Bug描述**：清晰描述问题
- **复现步骤**：详细的操作步骤
- **期望行为**：您期望的正确行为
- **实际行为**：实际发生的情况
- **环境信息**：操作系统、Node.js版本、微信开发者工具版本等
- **截图/日志**：如有必要，附上相关截图或错误日志

### 2. 提出新功能

如果您有新功能建议，请：

1. 先在 Issues 中讨论
2. 说明功能的使用场景
3. 提供设计思路或原型

### 3. 提交代码

#### 3.1 Fork 项目

```bash
# 1. Fork 项目到您的账号
# 2. 克隆到本地
git clone https://github.com/your-username/video-subtitle-remover.git

# 3. 添加上游仓库
git remote add upstream https://github.com/sypw233/video-subtitle-remover.git

# 4. 创建功能分支
git checkout -b feature/your-feature-name
```

#### 3.2 开发规范

##### 代码风格

- **TypeScript**：使用严格模式
- **Vue3**：使用 Composition API + `<script setup>`
- **命名规范**：
  - 文件名：kebab-case (`video-uploader.vue`)
  - 组件名：PascalCase (`VideoUploader`)
  - 变量/函数：camelCase (`handleSubmit`)
  - 常量：UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
  - 类型/接口：PascalCase (`UserInfo`, `TaskStatus`)

##### 代码格式

```bash
# 安装依赖
npm install

# 代码格式化
npm run format

# 代码检查
npm run lint
```

##### 提交信息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 格式：

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

**类型 (type)**：
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关
- `ci`: CI/CD相关

**示例**：
```
feat(upload): 添加分片上传功能

- 支持大文件分片上传
- 实现断点续传
- 添加上传进度显示

Closes #123
```

#### 3.3 提交PR

```bash
# 1. 同步上游代码
git fetch upstream
git rebase upstream/main

# 2. 推送到您的仓库
git push origin feature/your-feature-name

# 3. 在GitHub上创建Pull Request
```

##### PR要求

- ✅ 代码通过所有测试
- ✅ 代码通过ESLint检查
- ✅ 提交信息符合规范
- ✅ 更新相关文档
- ✅ 添加必要的测试用例
- ✅ PR描述清晰说明变更内容

---

## 开发环境

### 环境要求

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **微信开发者工具**: 最新稳定版
- **Git**: >= 2.0.0

### 环境配置

```bash
# 1. 克隆项目
git clone https://github.com/sypw233/video-subtitle-remover.git
cd video-subtitle-remover

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写配置

# 4. 启动开发服务器
npm run dev:mp-weixin

# 5. 在微信开发者工具中打开 dist/dev/mp-weixin 目录
```

### 项目结构

```
video-subtitle-remover/
├── src/
│   ├── api/                # API接口
│   ├── components/         # 组件
│   ├── pages/              # 页面
│   ├── store/              # 状态管理
│   ├── types/              # 类型定义
│   └── utils/              # 工具函数
├── docs/                   # 文档
├── database/               # 数据库脚本
├── .claude/                # Claude Code配置
└── 构建配置文件
```

---

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行E2E测试
npm run test:e2e

# 查看测试覆盖率
npm run test:coverage
```

### 编写测试

```typescript
// 示例：组件测试
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoUploader from '@/components/VideoUploader.vue'

describe('VideoUploader', () => {
  it('renders correctly', () => {
    const wrapper = mount(VideoUploader)
    expect(wrapper.exists()).toBe(true)
  })

  it('accepts video files', async () => {
    // 测试逻辑
  })
})
```

---

## 文档贡献

### 文档规范

- 使用中文撰写
- Markdown格式规范
- 包含代码示例
- 保持简洁明了

### 文档结构

```
docs/
├── getting-started/    # 入门指南
├── development/        # 开发文档
├── deployment/         # 部署文档
├── compliance/         # 合规文档
└── reference/          # 参考文档
```

---

## 代码审查

### 审查要点

- ✅ 代码功能正确
- ✅ 代码风格一致
- ✅ 无安全隐患
- ✅ 性能良好
- ✅ 文档完善
- ✅ 测试覆盖

### 审查流程

1. 提交PR
2. 自动化测试运行
3. 代码审查
4. 修改反馈
5. 合并代码

---

## 社区准则

### 我们的承诺

- 尊重每一位贡献者
- 接受建设性批评
- 专注于对社区最有利的事情
- 对他人表示同理心

### 不当行为

以下行为不被接受：

- 使用性暗示的语言或图像
- 恶意评论或人身攻击
- 公开或私下骚扰
- 未经允许发布他人私人信息

---

## 许可证

参与本项目即表示您同意您的贡献将在 [MIT许可证](LICENSE) 下发布。

---

## 联系方式

如有任何问题，请通过以下方式联系我们：

- **Issues**: [GitHub Issues](https://github.com/sypw233/video-subtitle-remover/issues)
- **Email**: [待填写]

---

## 致谢

感谢所有为本项目做出贡献的人！

[贡献者列表](https://github.com/sypw233/video-subtitle-remover/graphs/contributors)
