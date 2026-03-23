# 设计说明：提示词模板管理（version=0.0.9）

**输入需求**：`iterations/0.0.9/product/prd-prompt-templates-admin.md`、`user-stories-prompt-templates-admin.md`

---

## 1. 设计决策总览

| PRD 项 | 定稿 |
|--------|------|
| D1 信息架构 | 侧栏新增菜单 **「提示词管理」**，路由 **`/console/prompts`**；主区纵向卡片列表，每键一块。 |
| D2 占位符帮助 | 每卡片内 **说明 + 占位符表格**（名称、类型、含义）；摘要系统提示键在文案区下方展示 **必填占位符** 提示。 |
| D3 视觉 | 与现有 **ProLayout + PageContainer + zinc 背景** 一致；卡片用与「应用配置」同风格的 **白底/暗底圆角边框卡片**（`rounded-2xl border …`）。 |
| D4 恢复默认 | 与 0.0.4 一致：**浏览器 `confirm`**，确认后仅回填表单；**须再点「保存」** 才写盘（推荐）。 |
| D5 管理员可读性 | 每个录入项 **`label` 仅用中文**（与 §2.5 一致）；**不**以英文配置键作为主标签。须提供 **tip**（见 §5.4）说明**含义**（在请求链路中的作用）与**用法**（如何改、注意点、与占位符/其它配置的关系）。 |
| PRD §2.1.1 | 采用 **方案 A**：`messagesIncludeContextSummary` 使用与注入组装**相同规则**得到的前缀做 `startsWith`（无 `{{content}}` 时为整段渲染结果；有 `{{content}}` 时为 `content: ""` 的渲染结果）。 |

---

## 2. 模板语法与渲染语义

### 2.1 占位符格式

- 语法：**Mustache 风格双花括号** `{{name}}`。  
- `name`：ASCII **字母、数字、下划线**，且**必须以字母或下划线开头**（与常见编程标识符一致，便于校验与文档）。  
- **不支持**：条件、循环、过滤器、表达式；**禁止**在管理端执行脚本。  
- **字面量花括号**：首版 **不**支持转义；若需正文 `{{`，由产品规避或后续迭代增加转义规则。  
- **替换规则**：对模板全文做从左到右扫描，将每个合法 `{{name}}` 替换为对应字符串值；值由服务端在渲染时注入（数字等先 `String(value)`）。  
- **未替换的 `{{`…`}}`**：若 `name` 不在该键的**允许列表**内，**保存时拒绝**（见 §4）。

### 2.2 提示词键（V1）

| 配置键（JSON / 代码用） | 表单 Label（中文，必填） | 用途摘要 |
|-------------------------|--------------------------|----------|
| `contextSummaryInjectPrefix` | **摘要注入前缀** | 发往**对话模型**的摘要 system 消息：**渲染结果 + 摘要正文**；不含摘要正文本身。 |
| `contextSummarySystem` | **摘要生成系统提示** | 后台**单独调用模型刷新滚动摘要**时的 `system` 内容；须含长度约束语义，见占位符。 |

英文键名仅出现在技术文档、JSON 文件或可选「开发者信息」折叠区，**不作为表单主标签**。

### 2.3 各键允许占位符

| 键 | 允许占位符 | 说明 |
|----|------------|------|
| `contextSummaryInjectPrefix` | **（无）或 `content`** | **无占位符**：摘要正文拼在渲染结果之后。**或**恰好一处 **`{{content}}`**，须位于模板末尾，摘要替换该占位符；其前须有说明文字。不允许其它 `{{name}}`。 |
| `contextSummarySystem` | `maxChars` | 非负整数，语义同 `AppConfig.contextSummaryMaxChars`；渲染时由服务端传入当前配置值。 |

### 2.4 内置默认模板

- **来源**：与当前 `src/lib/chat/context-summary.ts` 中硬编码文案**语义等价**（实现时可将默认字符串集中在一处常量，供「恢复默认」与合并逻辑复用）。  
- **缺失/损坏**：读配置失败或某键缺失时，**回退到上述内置默认**，不阻断对话；管理页打开时展示**实际生效值**（合并后），若来自回退可在顶栏用 **黄色条** 提示「部分提示词使用内置默认」（可选，后端实现若难以区分可仅文档说明）。

### 2.5 各字段 Tip 文案（实现时可照搬或微调）

以下为管理员可见的 **含义 + 用法**，建议通过 **`Form.Item` 的 `tooltip`**（问号悬停）与/或 **`extra` 段落**展示；`extra` 可 2～4 句，`tooltip` 可与 `extra` 同文或更短。

| Label | Tip 要点（中文） |
|-------|------------------|
| **摘要注入前缀** | **含义**：当会话超过「最近 N 条」窗口时，服务端会在发给**对话模型**的消息列表**最前**插入一条 `system`。**用法**：可在末尾使用恰好一处 `{{content}}` 插入摘要；不用占位符时摘要仍拼在渲染结果之后。除 `{{content}}` 外不允许其它占位符。 |
| **摘要生成系统提示** | **含义**：用于**后台刷新滚动摘要**的那次模型调用（与用户在界面里和模型聊天不是同一次请求）。**用法**：必须保留 **`{{maxChars}}`**，对应应用配置里的摘要最大字符数；可调整语气与输出要求，但不要删掉长度相关约束。其它占位符 V1 不允许。 |

若使用 antd ProComponents / Ant Design：`label` 字符串为上表中文名；`tooltip={{ title: '…' }}` 或 `Typography.Paragraph type="secondary"` 承载上表要点。

---

## 3. 持久化与配置合并（设计对后端的约束）

- **定稿**：提示词**不**写入 `app-config.json`，使用**独立文件** **`prompt-templates.json`** 管理。  
- **默认路径**：与 `app-config.json` 同目录，**`{项目根}/data/prompt-templates.json`**（`data/` 已在 `.gitignore`）。  
- **环境变量（可选）**：**`PROMPT_TEMPLATES_PATH`** 指向绝对或相对路径时优先使用，语义对齐现有 **`APP_CONFIG_PATH`**。  
- **文件形态**：根对象为键到字符串的映射（字段名与 §2.2 配置键一致），例如：

```json
{
  "contextSummaryInjectPrefix": "…",
  "contextSummarySystem": "…"
}
```

- **合并规则**：磁盘上的值覆盖**内置默认**；未知键忽略；**缺省或文件缺失/损坏**时，各键回退到内置默认字符串（不阻断读对话配置）。  
- **缓存**：提示词文件使用**独立读取/缓存**（如 `getPromptTemplatesConfig()`）；**保存成功后立即失效并重读**，策略与 `app-config` 的「写盘后下次读取为最新」一致，但**不必**与 `getAppConfig()` 绑在同一对象上。

---

## 4. 校验（保存时，前后端）

| 规则 | 行为 |
|------|------|
| 空或仅空白 | **拒绝**，错误信息：「模板不能为空」。 |
| `contextSummaryInjectPrefix` 含非法占位符或 `{{content}}` 不在末尾 / 出现多次 / 前无正文 | **拒绝**（见实现错误文案）。 |
| `contextSummarySystem` 缺少 **`{{maxChars}}`** 子串 | **拒绝**，错误信息：「须包含 {{maxChars}}」。 |
| `contextSummarySystem` 出现允许列表外的 `{{name}}` | **拒绝**，列出允许的占位符。 |
| `contextSummarySystem` 含合法 `{{maxChars}}` 外的合法语法占位符 | 同上，视为未知占位符拒绝。 |

前端可做相同规则减少往返；**以服务端校验为准**。

---

## 5. 页面布局（IA）

### 5.1 导航

- 在 `ConsoleProShell` 的 `route.routes` 中增加一项：**名称**「提示词管理」，**路径** `/console/prompts`，图标建议 **`CommentOutlined`** 或 **`FileTextOutlined`**（与实现一致即可）。  
- `PAGE_TITLE` 增加 `"/console/prompts": "提示词管理"`。

### 5.2 顶栏与安全提示

- **继承** console layout：顶栏「返回对话」、**安全提示条**（与 `/console` 相同文案与样式）保留在 layout 层，本页不重复设计。

### 5.3 主内容

- **页内说明**（`PageContainer` 下首段，`text-sm text-zinc-600`）：简述「以下为发往大模型的服务端模板；修改后保存生效；占位符见各卡片说明」。  
- **操作区**（说明下方，`flex gap-3`）：**保存**（主按钮 violet）、**恢复默认**（次要 zinc）。行为同应用配置页 §D4。  
- **卡片列表**（垂直 `space-y-6`，每键一张卡片）：  
  - **卡片标题**：与 §2.2 **表单 Label（中文）**一致，可与表单项 `label` 相同。  
  - **Tip（必做）**：每条模板须具备管理员可读的 **含义与用法**（§2.5）；推荐 **`Form.Item` + `tooltip`**（标题旁 `?`）展开详情，并在输入框上方或下方用 **`extra`** 放 1～2 句摘要，避免未悬停就零说明。  
  - **占位符帮助**：小表格或 `Descriptions`：**占位符 | 含义**；无占位符的键写「当前版本无占位符」。  
  - **编辑器**：**多行文本** `textarea`，表单项 **`label` 必须为中文**（§2.2）；等宽字体（`font-mono text-sm`），最小高度约 **8～12 行**，可纵向拖拽（若用 antd `Input.TextArea` `autoSize`）。  
  - **可选**：卡片脚注用小字标注配置键（`contextSummaryInjectPrefix` 等）供排查 JSON，**非**主视觉。  
- **保存态反馈**：与应用配置一致——成功 **绿色** 短条、失败 **红色** 条；保存中按钮 disabled。

### 5.4 Label 与 Tip 的交互定稿

| 元素 | 要求 |
|------|------|
| Label | **仅中文**，与 §2.2「表单 Label」列一致。 |
| Tip | 必须覆盖 **是什么**（在系统中的作用）、**怎么用**（能改什么、不能删什么、与 `{{maxChars}}` 等的关系）。文案以 §2.5 为准。 |
| 可读性 | 避免在 label 上堆英文键名；技术字段名仅作辅助信息。 |

---

## 6. 用户故事映射

| 故事 | 设计落点 |
|------|----------|
| US-0.0.9-1 | §5.1 菜单与路由、`PAGE_TITLE` |
| US-0.0.9-2 | §5.3 / §5.4 中文 label 与 tip、§2.5 文案、§4 校验、保存/恢复 |
| US-0.0.9-3 | §2、§3（后端实现见 backend 文档） |
| US-0.0.9-4 | §1 方案 A |

---

## 7. 与后端交接（摘要）

- **读取**：专用模块读取 **`prompt-templates.json`** 并与内置默认合并（如 **`getPromptTemplatesMerged()`**）；提供 **`renderPromptTemplate(key, vars)`**（或等价）供 `context-summary` 与 `messagesIncludeContextSummary` 使用。  
- **写入**：**独立** Server Action 或 **`PUT /api/console/prompt-templates`**（或与 console API 并列的路径）；仅写 **`prompt-templates.json`**，**原子写**（临时文件 + rename），**不要**改写 `app-config.json`。  
- **API 错误体**：校验失败时返回明确 `message`，供前端红条展示。

---

## 8. 实现路径（建议）

- `src/app/console/prompts/page.tsx`（+ 可选 `PromptTemplatesForm.tsx` client）  
- `src/lib/config/paths.ts`（或并列）：**`getPromptTemplatesFilePath()`**（含 `PROMPT_TEMPLATES_PATH`）  
- `src/lib/prompt-templates/`：**读/写 `prompt-templates.json`**、内置默认、合并、`renderPromptTemplate`、按键允许占位符元数据（供校验与 UI）；**不**扩展 `AppConfig` 类型承载模板正文

---

## 9. 文档路径

- 迭代：`iterations/0.0.9/design/spec-prompt-templates-admin.md`  
- 同步：`docs/design/spec-prompt-templates-admin.md`
