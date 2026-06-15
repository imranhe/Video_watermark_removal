# 🎯 快速参考卡

## 可用技能命令

### Karpathy 原则（自动应用）
| 原则 | 描述 | 应用场景 |
|------|------|---------|
| 先思考再编码 | 明确假设，避免盲目实现 | 开始新功能前 |
| 简洁优先 | 最小代码解决问题 | 编写代码时 |
| 精准修改 | 只触碰必要的 | 修改现有代码时 |
| 目标驱动执行 | 定义成功标准 | 所有任务 |

### Matt Pocock 技能
| 命令 | 用途 | 使用时机 |
|------|------|---------|
| `/tdd` | 测试驱动开发 | 开始新功能 |
| `/diagnose` | 系统性调试 | 遇到问题时 |
| `/triage` | 问题分类 | 处理 issue |
| `/prototype` | 快速原型 | 验证想法 |
| `/handoff` | 任务交接 | 切换任务 |

---

## 常用脚本

### 检查脚本
```bash
# 运行所有检查
bash .claude/scripts/automation.sh

# 检查技能
bash .claude/scripts/check-skills.sh

# 检查编码
bash .claude/scripts/check-encoding.sh

# 运行前检查
bash .claude/scripts/pre-run-check.sh
```

### 修复脚本
```bash
# 修复编码
bash .claude/scripts/fix-encoding.sh
```

---

## 开发流程

### 1. 开始新功能
```bash
# 使用 TDD
/tdd video-upload

# 流程：
# 1. 写测试（红）
# 2. 写实现（绿）
# 3. 重构（重构）
```

### 2. 调试问题
```bash
# 使用诊断
/diagnose upload-fails

# 流程：
# 1. 收集信息
# 2. 形成假设
# 3. 测试假设
# 4. 找到根因
# 5. 实现修复
```

### 3. 提交代码
```bash
# 自动检查已启用
git add .
git commit -m "feat: add feature"

# Git 钩子会自动检查：
# ✅ UTF-8 编码
# ✅ 类型检查
# ✅ 代码风格
```

---

## 配置文件位置

| 文件 | 用途 |
|------|------|
| `CLAUDE.md` | 主配置 |
| `.editorconfig` | 编辑器配置 |
| `.gitattributes` | Git 编码配置 |
| `.claude/config/codex.json` | Codex 配置 |
| `.claude/config/automation.json` | 自动化配置 |

---

## 技能目录

```
.agents/skills/
├── setup-matt-pocock-skills/  # 初始化
├── tdd/                        # 测试驱动
├── diagnose/                   # 调试
├── triage/                     # 分类
├── prototype/                  # 原型
└── handoff/                    # 交接
```

---

## 常见问题速查

### 技能未检测到？
```bash
bash .claude/scripts/check-skills.sh
```

### 编码问题？
```bash
bash .claude/scripts/check-encoding.sh
bash .claude/scripts/fix-encoding.sh
```

### Git 钩子不工作？
```bash
chmod +x .git/hooks/pre-commit
```

---

## 开发命令

```bash
# 启动开发
npm run dev:h5

# 类型检查
npm run type-check

# 运行测试
npm run test

# 构建生产版本
npm run build:h5
```

---

## 编码规范速查

### TypeScript
- 严格模式：`strict: true`
- 目标：ESNext
- 模块：ESNext

### 命名约定
- 文件：PascalCase (组件), camelCase (工具)
- 变量：camelCase
- 类型：PascalCase
- 常量：UPPER_SNAKE_CASE
- CSS 类：kebab-case

### 提交规范
```
<type>(<scope>): <description>

类型：feat, fix, docs, style, refactor, test, chore
```

---

## 💡 提示

1. **技能自动检测** - 每次运行前自动检查
2. **编码自动修复** - 提交前自动检查
3. **原则自动应用** - Karpathy 规则始终生效
4. **配置统一管理** - 所有配置集中存放

---

**所有工具已就绪，开始高效开发吧！** 🚀
