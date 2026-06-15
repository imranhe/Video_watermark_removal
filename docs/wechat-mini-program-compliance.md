# 微信小程序合规性审核报告

**项目名称**: 视频去字幕小程序 (video-subtitle-remover)
**审核日期**: 2026-06-13
**审核版本**: v1.0.0
**技术栈**: uni-App (Vue3 + Vite + TypeScript) + Pinia
**目标平台**: 微信小程序 (mp-weixin)

---

## 一、技术规范符合度

### 1.1 API 兼容性

#### 1.1.1 Web API 兼容性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `uni.request` 网络请求 | ✅ 符合 | `src/api/request.ts` 正确使用 `uni.request` |
| `uni.getStorageSync` 本地存储 | ✅ 符合 | `src/utils/storage.ts` 正确使用 uni 存储 API |
| `uni.login` 登录 | ✅ 符合 | `src/store/user.ts` 正确使用微信登录 |
| `uni.chooseMedia` 选择视频 | ✅ 符合 | `src/utils/upload.ts` 使用 `uni.chooseMedia`（小程序 API） |
| `uni.navigateTo` 页面跳转 | ✅ 符合 | 所有页面跳转使用 uni API |
| `uni.showToast` 提示 | ✅ 符合 | 错误提示使用 uni API |
| `uni.previewMedia` 预览 | ✅ 符合 | `src/components/TaskStatus.vue` 正确使用 |
| `uni.getFileSystemManager` 文件系统 | ✅ 符合 | `src/utils/upload.ts` 分片上传使用文件系统 API |

#### 1.1.2 不支持的 Web API

| 检查项 | 状态 | 文件 | 说明 |
|--------|------|------|------|
| `EventSource` (SSE) | ❌ 不符合 | `src/utils/poller.ts:80` | 微信小程序**不支持** `EventSource` API。虽然代码有降级到轮询的逻辑，但 SSE 初始化本身会抛出异常，存在运行时错误风险 |
| `document.createElement('a')` | ❌ 不符合 | `src/components/TaskStatus.vue:141` | 微信小程序中不能使用 `document` API（已在条件编译 `#ifdef H5` 内，但需确认编译正确性） |
| `document.createElement('input')` | ⚠️ 潜在风险 | `src/utils/upload.ts:171` | 同上，在 H5 条件编译块内，需确保编译正确剥离 |
| `fetch` API | ❌ 不符合 | `src/utils/poller.ts:128`, `src/utils/upload.ts:315` | 微信小程序不原生支持 `fetch` API，应使用 `uni.request` 代替 |
| `XMLHttpRequest` | ❌ 不符合 | `src/utils/upload.ts:294` | 微信小程序不支持原生 `XMLHttpRequest`，应在小程序端使用 `uni.uploadFile` |
| `window.URL.revokeObjectURL` | ❌ 不符合 | `src/utils/upload.ts:188` | H5 条件编译块内，但微信小程序中不可用 |
| `import.meta.env` | ⚠️ 潜在风险 | 多个文件 | uni-app 中环境变量应通过 `process.env` 或条件编译获取，`import.meta.env` 在小程序端可能不可用 |

#### 1.1.3 条件编译检查

| 检查项 | 状态 | 文件 | 说明 |
|--------|------|------|------|
| `#ifdef MP-WEIXIN` 用户登录 | ✅ 符合 | `src/store/user.ts:32-46` | 正确使用条件编译隔离微信登录逻辑 |
| `#ifdef MP-WEIXIN` 视频选择 | ✅ 符合 | `src/utils/upload.ts:98-121` | 正确使用条件编译选择 `uni.chooseMedia` |
| `#ifdef H5` 视频选择 | ✅ 符合 | `src/utils/upload.ts:145-149` | H5 端逻辑已隔离 |
| `#ifdef MP-WEIXIN` 分片上传 | ⚠️ 不完整 | `src/utils/upload.ts:248-283` | 小程序端分片上传使用 `uni.request`，应改用 `uni.uploadFile` 支持二进制数据 |
| `#ifdef H5` 文件下载 | ✅ 符合 | `src/components/TaskStatus.vue:140-146` | H5 端下载逻辑已隔离 |
| `#ifdef MP-WEIXIN \|\| MP-ALIPAY` 媒体预览 | ⚠️ 语法问题 | `src/components/TaskStatus.vue:148` | 条件编译语法 `MP-WEIXIN \|\| MP-ALIPAY` 应为 `MP-WEIXIN,MP-ALIPAY` |

---

### 1.2 组件使用规范

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 使用 `view` 替代 `div` | ✅ 符合 | 全部使用 `<view>` 组件 |
| 使用 `text` 替代 `span` | ✅ 符合 | 全部使用 `<text>` 组件 |
| 使用 `button` 组件 | ✅ 符合 | 按钮使用标准 `<button>` |
| 使用 `video` 组件 | ✅ 符合 | `VideoUploader.vue` 使用 `<video>` |
| 自定义组件注册 | ✅ 符合 | `upload.vue` 正确引入 `VideoUploader` |
| `@tap` 替代 `@click` | ✅ 符合 | 全部使用 `@tap` 事件 |
| 组件命名规范 | ✅ 符合 | 使用 PascalCase 命名（如 `VideoUploader.vue`, `TaskStatus.vue`） |
| `<script setup>` 语法 | ✅ 符合 | Vue3 Composition API 风格 |

---

### 1.3 权限配置

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `manifest.json` 中 `mp-weixin.appid` | ❌ 不符合 | `appid` 为空，必须填写微信小程序 AppID |
| `manifest.json` 中 `name` | ❌ 不符合 | 应用名称为空，审核会被驳回 |
| `manifest.json` 中 `description` | ❌ 不符合 | 应用描述为空，审核会被驳回 |
| `urlCheck` 设置为 `false` | ⚠️ 潜在风险 | 开发阶段关闭域名校验，上线前必须改为 `true` |
| 相机/相册权限声明 | ❌ 未配置 | 未在 `mp-weixin` 配置中声明 `camera` 和 `album` 权限，使用 `uni.chooseMedia` 需要相册权限 |
| 隐私协议配置 | ❌ 未配置 | 未配置 `__usePrivacyCheck__` 和隐私协议弹窗，2023年9月后上线必须配置 |
| 用户授权说明 | ❌ 未配置 | 未在 `manifest.json` 中配置 `permission` 字段说明权限用途 |
| `setting.json` 配置 | ❌ 未配置 | 缺少 `src/pages.json` 中的 `requiredPrivateInfos`（如 `chooseMedia`） |

---

### 1.4 性能要求

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 主包大小限制 (2MB) | ⚠️ 需检查 | `src/` 目录 22MB（含 macOS 资源文件 `._*`），构建后需确认主包 < 2MB |
| 分包配置 | ❌ 未配置 | 未配置分包（subpackages），9 个页面全部在主包中，可能导致超限 |
| 页面层级限制 (10层) | ✅ 符合 | 当前页面跳转层级：index -> upload -> preview -> processing -> result，共 4 层 |
| `setData` 数据大小 | ⚠️ 潜在风险 | Pinia 状态管理中 tasks 数组可能包含大量任务数据，建议限制单次 setData 数据量 |
| 网络请求并发限制 | ⚠️ 潜在风险 | `src/utils/poller.ts` 轮询 + `upload.ts` 分片上传可能并发超过 10 个请求 |
| tabBar 数量 | ✅ 符合 | 3 个 tab（首页、历史、我的），符合 2-5 个限制 |
| macOS 资源文件 | ❌ 需清理 | `src/` 目录包含大量 `._*` macOS 资源文件，会增大包体积 |

---

### 1.5 存储规范

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 本地存储大小限制 (10MB) | ⚠️ 潜在风险 | `src/utils/storage.ts` 使用 `uni.setStorageSync` 存储 JSON 数据，需控制总量 |
| 存储 Key 命名 | ✅ 符合 | 使用 `video_remover_` 前缀，避免冲突 |
| Token 存储 | ✅ 符合 | `access_token` 使用 `uni.setStorageSync` 存储 |
| 缓存策略 | ⚠️ 缺失 | 无缓存过期和清理机制 |
| 文件存储路径 | ⚠️ 需检查 | 视频临时文件路径使用 `tempFilePath`，小程序端临时文件有容量限制 |

---

### 1.6 页面配置

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pages.json` 页面声明 | ❌ 严重问题 | 声明了 9 个页面，但仅有 `index` 和 `upload` 两个 `.vue` 文件存在，其余 7 个页面文件缺失 |
| 缺失页面列表 | ❌ | `preview`, `processing`, `result`, `login`, `user`, `history`, `recharge` 页面文件均不存在 |
| tabBar 图标文件 | ❌ 严重问题 | `src/static/tab/` 目录为空，缺少 6 个 tab 图标文件 |
| 页面标题 | ✅ 符合 | 所有页面均有 `navigationBarTitleText` |
| 全局样式 | ✅ 符合 | `globalStyle` 配置完整 |

---

## 二、审核规范符合度

### 2.1 内容合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| UGC 内容处理 | ⚠️ 需关注 | 用户上传视频属于 UGC 内容，需要接入微信内容安全 API（`security.msgSecCheck` 或图片/视频内容审核） |
| 内容审核接口 | ❌ 未实现 | 未在代码中发现任何内容审核/安全检查逻辑 |
| 敏感内容过滤 | ❌ 未实现 | 无敏感词过滤、敏感内容检测机制 |
| 视频来源合法性 | ⚠️ 需关注 | "去字幕"功能可能涉及版权内容处理，需在用户协议中明确使用场景限制 |

### 2.2 功能合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 小程序定位匹配 | ✅ 符合 | "视频去字幕"功能属于工具类，符合小程序工具定位 |
| 虚拟支付 | ❌ 存在风险 | `src/store/order.ts` 和 `src/pages/recharge/` 充值中心涉及虚拟积分（credits）购买。iOS 端不允许虚拟支付，需接入微信官方支付或使用实物/服务类支付 |
| 诱导分享 | ✅ 符合 | 未发现强制分享或诱导分享行为 |
| 功能完整性 | ❌ 不符合 | 7 个页面文件缺失，功能不完整，无法通过审核 |

### 2.3 隐私合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 隐私协议 | ❌ 未配置 | 无隐私协议页面和配置 |
| 用户数据收集说明 | ❌ 未配置 | 未声明收集用户信息的类型和用途 |
| `__usePrivacyCheck__` | ❌ 未配置 | 未在 `manifest.json` 中启用隐私协议检查 |
| `requiredPrivateInfos` | ❌ 未配置 | 未声明需要收集的隐私信息类型（如相册访问、摄像头） |
| 隐私弹窗组件 | ❌ 未实现 | 未实现隐私协议弹窗组件 |
| 数据加密传输 | ✅ 符合 | API 请求使用 HTTPS（生产环境），JWT Token 认证 |
| 数据本地存储 | ⚠️ 需关注 | Token 和用户信息明文存储在本地，建议敏感数据加密存储 |

### 2.4 支付合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 微信支付接口 | ❌ 未实现 | `src/store/order.ts` 中 `payOrder` 为 Mock 实现，未对接微信支付 |
| 虚拟商品限制 | ❌ 存在风险 | 充值积分（credits）属于虚拟商品，iOS 端不能使用微信支付购买虚拟商品 |
| 支付安全 | ❌ 未实现 | 无支付签名验证、无防重复支付机制 |
| 支付回调 | ❌ 未实现 | 无支付结果回调处理逻辑 |

### 2.5 分享合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `onShareAppMessage` | ❌ 未实现 | 未在页面中实现分享回调 |
| `onShareTimeline` | ❌ 未实现 | 未实现朋友圈分享 |
| 分享内容合规 | ⚠️ 需关注 | 若支持分享处理结果视频，需确保视频内容合规 |

---

## 三、代码质量符合度

### 3.1 代码规范

| 检查项 | 状态 | 说明 |
|--------|------|------|
| TypeScript 使用 | ✅ 符合 | 全部使用 TypeScript，有类型定义 |
| ESLint 配置 | ❌ 缺失 | 未配置 ESLint 规则文件（`.eslintrc.*`） |
| Prettier 配置 | ❌ 缺失 | 未配置代码格式化规则 |
| 代码注释 | ✅ 良好 | API 模块、Store、Utils 均有 JSDoc 注释 |
| 类型定义完整性 | ✅ 良好 | `src/types/` 目录包含完整的类型定义文件 |
| 统一类型复用 | ⚠️ 不一致 | `src/api/task.ts`、`src/store/task.ts`、`src/types/task.d.ts` 中 `Task` 类型重复定义，未统一使用 `src/types/` 中的定义 |

### 3.2 安全性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| XSS 防护 | ✅ 基本符合 | Vue 模板默认转义 HTML，`<text>` 组件自动防 XSS |
| 敏感信息泄露 | ❌ 严重风险 | `src/api/aliyun.ts:119-120` 将 `AccessKeyId` 和 `AccessKeySecret` 通过环境变量传入前端，虽然实际调用走了后端代理，但客户端代码中存在密钥相关类型定义，存在风险 |
| JWT Token 管理 | ✅ 符合 | Token 通过 Header 传递，401 时自动清除并跳转登录 |
| `urlCheck` 关闭 | ❌ 安全风险 | `manifest.json` 中 `urlCheck: false`，上线后会关闭域名校验 |
| 环境变量安全 | ⚠️ 潜在风险 | `.env.local` 包含数据库密码等敏感信息（虽然已被 `.gitignore` 排除） |

### 3.3 错误处理

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 网络错误处理 | ✅ 符合 | `src/api/request.ts` 有完整的 HTTP 状态码处理和 `fail` 回调 |
| 用户输入验证 | ⚠️ 部分符合 | `upload.ts` 有文件大小验证，但缺少文件格式验证 |
| 异常捕获 | ✅ 良好 | Store actions 使用 `try-catch` 包裹，有错误状态管理 |
| 上传错误恢复 | ✅ 符合 | 分片上传支持重试和断点续传 |
| 轮询重试机制 | ✅ 符合 | `src/utils/poller.ts` 有最大重试次数限制 |

---

## 四、潜在风险点总结

### 高风险 (必须修复才能通过审核)

1. **[P0] 7 个页面文件缺失** - `preview`, `processing`, `result`, `login`, `user`, `history`, `recharge` 页面已在 `pages.json` 中声明但文件不存在，编译将直接报错
2. **[P0] TabBar 图标文件缺失** - `src/static/tab/` 目录为空，缺少 6 个图标文件
3. **[P0] AppID 未配置** - `manifest.json` 中 `mp-weixin.appid` 为空
4. **[P0] 应用名称和描述未配置** - `manifest.json` 中 `name` 和 `description` 为空
5. **[P0] 隐私协议未配置** - 2023年9月起微信要求所有小程序必须配置隐私协议
6. **[P0] 权限声明缺失** - 相册/相机权限未在配置中声明
7. **[P0] `fetch` API 在小程序中不可用** - `src/utils/poller.ts` 和 `src/utils/upload.ts` 中直接使用了 `fetch`

### 中风险 (可能导致审核驳回)

8. **[P1] 虚拟支付合规** - iOS 端虚拟商品（积分）支付需遵守苹果 IAP 规则
9. **[P1] UGC 内容安全审核缺失** - 用户上传视频需接入微信内容安全 API
10. **[P1] 分包未配置** - 9 个页面全在主包可能超 2MB 限制
11. **[P1] EventSource 不支持** - SSE 在小程序端不可用，需默认使用轮询
12. **[P1] `urlCheck: false`** - 上线前必须改为 `true`

### 低风险 (建议优化)

13. **[P2] macOS 资源文件** - `._*` 文件增大包体积
14. **[P2] 类型定义重复** - Task 等类型在多处重复定义
15. **[P2] ESLint/Prettier 缺失** - 代码规范工具未配置
16. **[P2] 缓存过期策略缺失** - 本地存储无清理机制

---

## 五、修复建议

### 优先级 P0 (立即修复)

#### 1. 补全缺失页面
```
需要创建以下页面文件:
- src/pages/preview/preview.vue
- src/pages/processing/processing.vue
- src/pages/result/result.vue
- src/pages/login/login.vue
- src/pages/user/user.vue
- src/pages/history/history.vue
- src/pages/recharge/recharge.vue
```

#### 2. 补全 TabBar 图标
```
需要添加以下图标文件到 src/static/tab/:
- home.png (81x81, < 40KB)
- home-active.png (81x81, < 40KB)
- history.png (81x81, < 40KB)
- history-active.png (81x81, < 40KB)
- user.png (81x81, < 40KB)
- user-active.png (81x81, < 40KB)
```

#### 3. 配置 manifest.json
```json
{
  "name": "视频去字幕",
  "appid": "wx_your_appid_here",
  "description": "一键去除视频中的字幕和图标",
  "mp-weixin": {
    "appid": "wx_your_appid_here",
    "setting": {
      "urlCheck": true
    },
    "usingComponents": true,
    "permission": {
      "scope.writePhotosAlbum": {
        "desc": "用于保存处理后的视频到相册"
      }
    },
    "requiredPrivateInfos": ["chooseMedia"],
    "__usePrivacyCheck__": true
  }
}
```

#### 4. 修复小程序端不支持的 API
将 `src/utils/poller.ts` 中的 `fetch` 改为 `uni.request`:
```typescript
// 修改前
const response = await fetch(`${apiBase}/api/tasks/${taskId}`);
// 修改后
const [err, response] = await uni.request({
  url: `${apiBase}/api/tasks/${taskId}`,
  method: 'GET'
});
```

将 `src/utils/poller.ts` 中 SSE 默认关闭:
```typescript
// 修改前
useSSE: true,
// 修改后 (微信小程序端)
useSSE: false, // 小程序不支持 EventSource
```

#### 5. 配置隐私协议
- 创建隐私协议页面
- 添加 `__usePrivacyCheck__: true` 配置
- 在 App.vue 中实现隐私协议弹窗

### 优先级 P1 (提审前修复)

#### 6. 接入内容安全审核
```typescript
// 后端实现: 调用微信内容安全 API
// POST https://api.weixin.qq.com/wxa/msg_sec_check
```

#### 7. 配置分包
```json
// pages.json 中添加
{
  "subPackages": [{
    "root": "pages-sub",
    "pages": [
      { "path": "preview/preview" },
      { "path": "processing/processing" },
      { "path": "result/result" },
      { "path": "recharge/recharge" }
    ]
  }]
}
```

#### 8. 修复条件编译语法
```typescript
// 修改前
// #ifdef MP-WEIXIN || MP-ALIPAY
// 修改后
// #ifdef MP-WEIXIN,MP-ALIPAY
```

### 优先级 P2 (上线后优化)

#### 9. 清理 macOS 资源文件
```bash
find . -name "._*" -delete
# 添加到 .gitignore
echo "._*" >> .gitignore
```

#### 10. 统一类型定义
将所有 Task/User/Order 类型统一从 `src/types/` 导入，移除 `src/api/` 和 `src/store/` 中的重复定义。

---

## 六、审核清单

### 提审前必须完成

- [ ] 补全 7 个缺失页面文件
- [ ] 补全 6 个 TabBar 图标文件
- [ ] 填写 `manifest.json` 中的 `appid`、`name`、`description`
- [ ] 将 `urlCheck` 改为 `true`
- [ ] 配置隐私协议（`__usePrivacyCheck__`）
- [ ] 声明权限（`permission` + `requiredPrivateInfos`）
- [ ] 修复 `fetch` API 为 `uni.request`
- [ ] 修复 `EventSource` 默认关闭
- [ ] 修复条件编译语法（`||` -> `,`）
- [ ] 接入微信内容安全审核 API
- [ ] 清理 macOS `._*` 资源文件

### 提审前建议完成

- [ ] 配置分包以控制主包大小
- [ ] 实现微信支付对接（替代 Mock）
- [ ] 添加 `onShareAppMessage` 分享功能
- [ ] 配置 ESLint + Prettier
- [ ] 统一类型定义
- [ ] 添加缓存过期策略

### 功能测试清单

- [ ] 微信登录流程正常
- [ ] 视频选择（相册/相机）正常
- [ ] 视频上传（分片上传 + 断点续传）正常
- [ ] 任务创建和状态轮询正常
- [ ] 处理结果预览和下载正常
- [ ] 任务历史列表加载正常
- [ ] 充值支付流程正常（需对接真实支付）
- [ ] 个人中心信息展示正常
- [ ] 弱网环境下错误处理正常
- [ ] 页面层级跳转正常（无超过 10 层）

---

**审核结论**: 当前项目处于开发中期阶段，核心基础设施（网络请求、状态管理、平台适配、组件封装）已搭建完成，但存在 **7 个关键阻塞问题**（P0）需要在提审前全部修复。主要风险集中在：页面文件缺失、配置项空白、隐私合规缺失、小程序不兼容 API 使用。建议按照优先级逐步修复后再进行提审。
