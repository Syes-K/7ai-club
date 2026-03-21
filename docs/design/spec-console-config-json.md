# 设计说明：/console JSON 配置后台（version=0.0.4）

**输入需求**：`iterations/0.0.4/product/prd-console-config-json.md`、`user-stories-console-config-json.md`

---

## 1. 设计决策（D1～D4 定稿）

### D1 信息架构：/console 布局

| 区域 | 内容 |
|------|------|
| **顶栏** | 左侧标题 **「应用配置」**；右侧文字链 **「返回对话」** → `/`。 |
| **安全提示条** | 全宽 **amber/zinc** 弱对比条，文案见 D4，置于顶栏下方。 |
| **主表单容器** | 单列 **`max-w-2xl mx-auto`**，`px-4 py-8`；背景与根布局一致（`zinc-50` / `dark:zinc-950`）。 |
| **分组一「模型与上下文」** | 卡片：`rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900`。字段：`maxMessagesInContext`（数字输入）、`defaultProvider`（`select`：DeepSeek / 智谱）、`defaultModel`（**与 `ChatApp` 同结构的分组 `select`**，仅可选 `ZHIPU_MODEL_IDS`；默认厂商为 DeepSeek 时附说明：DeepSeek 请求固定 `deepseek-chat`，此处为切回智谱时的默认型号）。 |
| **分组二「展示与日志」** | 同上卡片样式。字段：`appDisplayName`（文本，`maxLength` 建议 40）、`chatLoggingEnabled`（**checkbox**，标签「启用聊天日志（文件 + 控制台）」）。 |
| **操作区** | 卡片外 **`flex gap-3`**：**保存**（`violet` 主按钮）、**恢复默认**（`zinc` 次要按钮）。 |

**恢复默认**：点击后弹出浏览器 **`confirm`**：`确定将所有项恢复为内置默认值？未保存的修改将丢失。` 确认后表单回填默认合并值（是否立即写盘由实现可选；**设计推荐**确认后仅更新表单，仍须再点「保存」写盘，避免误触）。

### D2 交互：校验、损坏 JSON、保存态

| 场景 | 行为 |
|------|------|
| **保存中** | **保存**按钮 `disabled`，文案改为「保存中…」或旁加小号 `aria-busy` 说明。 |
| **保存成功** | 顶表单上方 **绿色** 简短条 `已保存`，3～5s 自动消失，或直至下一次编辑。 |
| **保存失败** | **红色** 条展示服务端返回错误全文；字段级错误可在对应 `input` 下 **`text-xs text-red-600`**。 |
| **JSON 损坏 / 无法解析** | 页顶 **黄色** 提示条：`配置文件无法解析，已使用内置默认值。保存后将写入新文件。` 表单仍可用。 |
| **数值越界** | `maxMessagesInContext`：前端限制 `min=1` `max=200`（与 PRD 一致）；后端校验为准。 |

### D3 视觉

- 与对话页统一：**zinc** 中性、主操作 **violet**、圆角 **`rounded-xl`/`rounded-2xl`**、边框与 `ChatApp` 顶栏一致。
- 不使用复杂侧栏；单页表单即可。

### D4 安全提示（无鉴权）

- 文案：**「注意：本页无登录验证，请勿将 /console 暴露到公网；建议仅内网或通过网关鉴权后访问。」**
- 位置：顶栏下方、`rounded-lg` 的 **`bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200`** 条，内边距 `px-4 py-2`，与主容器同宽限制内对齐。

---

## 2. `chatLoggingEnabled` 行为（设计定稿）

- **`true`**：`logChat` 与现网一致（写 `.next/logs` + 控制台）。
- **`false`**：**既不写文件，也不在控制台输出** `logChat` 内容（与 PRD「绑定同时关闭」一致），避免「关文件仍刷屏」。

---

## 3. `appDisplayName` 生效范围

- **对话页顶栏** `ChatApp` 内主标题（原「AI 对话」）。
- **站点 `<title>`**：根 `layout` 或对话路由 layout 使用配置；若全局 `metadata` 在构建期固定，实现上可用 **客户端 `document.title`** 或 **服务端 per-request metadata**（由后端实现选型，设计验收：浏览器标签与顶栏一致）。
- **`/console` 入口**：**不在**对话页提供指向 `/console` 的链接或按钮；管理员通过直接输入 URL、书签或内网导航进入，降低管理地址被普通访客扫到的面。

---

## 4. 用户故事映射

| 故事 | 设计落点 |
|------|----------|
| US-1 | 表单加载、损坏 JSON 黄条 |
| US-2 | 保存/恢复默认、成功绿条/错误红条 |
| US-3 | 分组一、二字段与说明文案 |
| US-4 | 分组二 checkbox + §2 行为 |
| US-5 | 文档，无单独 UI |

---

## 5. 与后端交接

- 首屏数据：**Server Component** 调 `getAppConfig()` 直出表单初值；或 `GET /api/console/config`（二选一，实现定）。
- 保存：**Server Action** 或 **`PUT /api/console/config`** + JSON body，返回 `{ ok }` / `{ error }`。

---

## 6. 实现路径（建议）

- `src/app/console/page.tsx`（+ 可选 `ConsoleConfigForm.tsx` client）
- `src/lib/config/`：`schema`、`getAppConfig`、`saveAppConfig`（原子写）

---

## 7. 文档路径

- 迭代：`iterations/0.0.4/design/spec-console-config-json.md`
- 同步：`docs/design/spec-console-config-json.md`
