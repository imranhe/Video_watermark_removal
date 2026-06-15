# 项目配置指南

本文档是视频去字幕小程序项目配置的统一参考，合并了技能配置、编码规范和自动化检查的全部信息。

---

## 1. 核心配置概览

### 已完成的配置

| 配置项 | 状态 | 说明 |
|--------|------|------|
| Karpathy Skills | 已集成 | 编码四大原则，适配 Codex |
| Matt Pocock Skills | 已安装 | 6 个核心工程技能 |
| UTF-8 编码 | 已配置 | 全项目 UTF-8 保证 |
| 自动化检查 | 已启用 | 运行前自动验证 |

### 验证结果

```
✓ CLAUDE.md configured
✓ Karpathy principles loaded
✓ Matt Pocock skills configured
✓ UTF-8 encoding configured
✓ Git repository initialized
✓ Skills: 6/6 available
✓ Automation checks complete
```

---

## 2. 配置文件结构

```
video-watermark-removal/
├── CLAUDE.md                    # 主配置（Karpathy + Matt Pocock）
├── .editorconfig                # 编辑器配置
├── .gitattributes               # Git 编码配置
│
├── .claude/
│   ├── config/
│   │   ├── codex.json           # Codex 配置
│   │   └── automation.json      # 自动化配置
│   ├── scripts/
│   │   ├── check-skills.sh      # 技能检查
│   │   ├── check-encoding.sh    # 编码检查
│   │   ├── fix-encoding.sh      # 编码修复
│   │   ├── pre-run-check.sh     # 运行前检查
│   │   └── automation.sh        # 主自动化脚本
│   └── hooks/
│       └── pre-commit           # Git 提交钩子
│
├── .agents/skills/              # Matt Pocock 技能
│   ├── setup-matt-pocock-skills/
│   ├── tdd/
│   ├── diagnose/
│   ├── triage/
│   ├── prototype/
│   └── handoff/
│
└── video-subtitle-remover/      # 前端项目
    └── (项目文件)
```

### 配置文件用途

| 文件 | 用途 |
|------|------|
| `CLAUDE.md` | 主配置（Karpathy + Matt Pocock） |
| `.editorconfig` | 编辑器编码配置 |
| `.gitattributes` | Git 编码配置 |
| `.claude/config/codex.json` | Codex 集成配置 |
| `.claude/config/automation.json` | 自动化配置 |

### 自动化脚本

| 脚本 | 用途 |
|------|------|
| `.claude/scripts/check-skills.sh` | 技能检查 |
| `.claude/scripts/check-encoding.sh` | 编码检查 |
| `.claude/scripts/fix-encoding.sh` | 编码修复 |
| `.claude/scripts/pre-run-check.sh` | 运行前检查 |
| `.claude/scripts/automation.sh` | 主自动化脚本 |

---

## 3. Karpathy 编码原则

### 原则一：先思考再编码

**不要假设。不要隐藏困惑。展示权衡。**

在实现之前：
- 明确说明你的假设。如果不确定，请询问。
- 如果存在多种解释，请呈现它们 -- 不要默默选择。
- 如果存在更简单的方法，请说出来。必要时提出反对。
- 如果不清楚，请停止。说明困惑之处。询问。

### 原则二：简洁优先

**解决问题的最小代码量。无投机性代码。**

- 不要超出要求的功能。
- 不要为单次使用的代码创建抽象。
- 不要创建未请求的"灵活性"或"可配置性"。
- 不要为不可能的场景添加错误处理。
- 如果写了 200 行但可以写 50 行，请重写。
- 问自己："高级工程师会说这太复杂了吗？"如果是，请简化。

### 原则三：精准修改

**只触碰必须的。只清理自己的混乱。**

编辑现有代码时：
- 不要"改进"相邻代码、注释或格式。
- 不要重构没有问题的东西。
- 匹配现有风格，即使你会用不同方式做。
- 如果注意到不相关的死代码，请提及 -- 不要删除。

当你的更改创建孤立代码时：
- 删除你的更改使其未使用的导入/变量/函数。
- 除非被要求，否则不要删除预先存在的死代码。

测试：每一行更改都应直接追溯到用户的请求。

### 原则四：目标驱动执行

**定义成功标准。循环直到验证。**

将任务转化为可验证的目标：
- "添加验证" -> "为无效输入编写测试，然后使其通过"
- "修复错误" -> "编写重现错误的测试，然后使其通过"
- "重构 X" -> "确保重构前后测试都通过"

对于多步骤任务，陈述简要计划：
```
1. [步骤] -> 验证: [检查]
2. [步骤] -> 验证: [检查]
3. [步骤] -> 验证: [检查]
```

---

## 4. Matt Pocock 技能使用

### 已安装技能（6 个）

| 技能 | 命令 | 用途 |
|------|------|------|
| setup-matt-pocock-skills | `/setup-matt-pocock-skills` | 初始化配置（已自动完成） |
| tdd | `/tdd [feature]` | 测试驱动开发 |
| diagnose | `/diagnose [problem]` | 系统性调试 |
| triage | `/triage [issue]` | 问题分类 |
| prototype | `/prototype [idea]` | 快速原型 |
| handoff | `/handoff [task]` | 任务交接 |

### 使用场景示例

**场景 1：开始新功能（TDD）**
```bash
/tdd video-upload
# 流程：写测试（红） -> 写实现（绿） -> 重构 -> 提交（自动检查）
```

**场景 2：调试问题（Diagnose）**
```bash
/diagnose upload-fails
# 流程：收集信息 -> 形成假设 -> 测试假设 -> 找到根因 -> 实现修复
```

**场景 3：处理 Issue（Triage）**
```bash
/triage "Video upload fails for large files"
# 输出：分类、优先级、标签、下一步
```

**场景 4：验证想法（Prototype）**
```bash
/prototype video-thumbnail
# 流程：快速实现核心逻辑 -> 验证技术可行性 -> 决定是否继续
```

### 自动化脚本命令

```bash
bash .claude/scripts/automation.sh       # 主自动化检查
bash .claude/scripts/check-skills.sh     # 检查技能
bash .claude/scripts/check-encoding.sh   # 检查编码
bash .claude/scripts/fix-encoding.sh     # 修复编码
```

---

## 5. 使用指南

### 首次设置

```bash
# 1. 确认技能已安装
bash .claude/scripts/check-skills.sh

# 2. 检查编码
bash .claude/scripts/check-encoding.sh

# 3. 运行自动化检查
bash .claude/scripts/automation.sh
```

### 日常开发

```bash
# 进入项目目录
cd video-subtitle-remover

# 启动开发服务器
npm run dev:h5

# 使用技能
/tdd video-upload
/diagnose [problem-description]
/triage [issue-description]
/prototype [idea]
```

### 提交代码

```bash
# Git 会自动运行 pre-commit 钩子
git add .
git commit -m "feat: add new feature"

# 钩子会检查：
# 1. UTF-8 编码
# 2. 技能配置
# 3. 类型检查
# 4. 代码风格
```

---

## 6. 最佳实践

### 编码规范

- **始终使用 UTF-8** -- 避免乱码问题
- **LF 换行符** -- 跨平台兼容（Unix 风格）
- **最终换行符** -- 符合 POSIX 标准
- **移除尾随空格** -- 保持代码整洁

支持的文件类型：TypeScript (.ts)、Vue (.vue)、JavaScript (.js)、JSON (.json)、Markdown (.md)、CSS (.css)、HTML (.html)、Shell (.sh)

### 技能使用

- **TDD 优先** -- 先写测试，再写实现
- **诊断系统化** -- 使用 `/diagnose` 而非随机尝试
- **问题分类** -- 使用 `/triage` 组织问题
- **文档化** -- 记录决策和解决方案

### 自动化流程

- **提交前检查** -- 确保代码质量
- **运行前检查** -- 验证环境配置
- **技能检测** -- 自动发现可用工具
- **编码验证** -- 防止乱码问题

### 团队协作

- **统一配置** -- 所有开发者使用相同配置
- **技能共享** -- 通过 Git 共享技能定义
- **编码标准** -- .editorconfig 确保一致性
- **自动化检查** -- CI/CD 集成

### 配置 JSON 验证

```bash
# 验证 JSON 格式
cat .claude/config/automation.json | jq .
cat .claude/config/codex.json | jq .
```

---

## 7. 故障排除

### 技能未检测到

**问题**：技能检查显示 0/6 可用

**解决**：
```bash
# 检查技能目录
ls -la .agents/skills/

# 重新安装技能
npx skills@latest add mattpocock/skills

# 验证
bash .claude/scripts/check-skills.sh
```

### 编码问题

**问题**：文件显示乱码

**解决**：
```bash
# 检查编码
bash .claude/scripts/check-encoding.sh

# 修复编码
bash .claude/scripts/fix-encoding.sh

# 验证修复
bash .claude/scripts/check-encoding.sh
```

### Git 钩子不工作

**问题**：提交时未运行检查

**解决**：
```bash
# 重新安装钩子
ln -sf ../../.claude/hooks/pre-commit .git/hooks/pre-commit

# 检查钩子权限
chmod +x .git/hooks/pre-commit

# 测试
git commit -m "test" --allow-empty
```

### 配置文件损坏

**问题**：JSON 配置文件解析错误

**解决**：
```bash
# 验证 JSON 格式
cat .claude/config/automation.json | jq .
cat .claude/config/codex.json | jq .

# 重新创建配置（参考本文档的配置文件结构章节）
```

---

## 8. 下一步行动

### 立即开始

1. **运行自动化检查** -- 验证所有配置
2. **选择一个技能** -- 开始使用 `/tdd` 或 `/diagnose`
3. **启动开发** -- `npm run dev:h5`

### 短期目标（本周）

- 使用 TDD 完成一个功能
- 使用 `/diagnose` 调试一个问题
- 提交代码并验证 pre-commit 钩子

### 中期目标（本月）

- 完成 Phase 3 用户系统
- 集成所有 Matt Pocock 技能
- 建立完整的测试覆盖

### 长期目标（季度）

- 完成整个项目开发
- 部署到生产环境
- 建立 CI/CD 流水线

---

## 质量指标

### 配置完整性

- 核心配置文件：4/4
- Claude 配置：2/2
- 自动化脚本：5/5
- Git 钩子：1/1
- 技能文件：6/6

### 核心优势

| 方面 | 说明 |
|------|------|
| 代码质量 | Karpathy 原则防止常见错误，TDD 确保正确性 |
| 开发效率 | 技能自动检测和建议，编码问题自动修复 |
| 团队协作 | 统一编码规范，共享技能定义 |
| 项目可维护性 | UTF-8 编码避免乱码，清晰配置结构 |
