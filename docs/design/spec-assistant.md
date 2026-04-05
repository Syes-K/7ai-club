# 设计说明：助手（Assistants）（version=0.3.1）

**输入需求**：`iterations/0.3.1/product/prd-assistant.md`、`user-stories-assistant.md`

---

## 1. 设计决策总览

| PRD 待设计项 | 定稿 |
|--------------|------|
| **D1 信息架构** | 侧栏 **「助手」** → **`/console/assistants`** 列表；**新建** → **`/console/assistants/new`**；**编辑** → **`/console/assistants/[assistantId]`**（与知识库「列表 + 详情/编辑」同构，降低心智负担）。 |
| **D2 新建会话** | 对话页点击 **「新会话」** 时，**先**弹出 **`Modal`（居中，宽度 `max-w-md`）**：必选 **助手**（`Select`，首项为 **「无助手」**，`value=""`）；底部 **「创建会话」** 主按钮；取消则关闭弹窗、不创建会话。创建成功后关闭弹窗并切换到新会话（与现有 `apiCreateSession` 行为对齐，请求体增加 `assistantId`）。 |
| **D3 只读态** | 当前会话有绑定助手时，在 **聊天区标题栏右侧**（或标题行第二行）展示 **emoji + 名称** 的 **只读** `Tag`/`span`（`text-sm`，`zinc-600` / `dark:zinc-400`）；**无**下拉、无切换。无助手时不展示该块。 |
| **D4 快捷语** | 绑定助手且 `quickPhrases.length > 0` 时，在 **输入框（`textarea`）上方** 展示 **横向可换行** 的 **次要按钮组**（`Button size="small" type="default"`）；**点击行为**：将快捷语文本 **写入输入框**（`setInput`），**不自动发送**（用户再按 Enter 发送），避免误触消耗额度。快捷语过多时：**单行 + 横向滚动**（`overflow-x-auto flex gap-2 flex-nowrap`），或 **折叠「更多」**（第二版可选；首版滚动即可）。 |
| **D5 Emoji** | **单行 `Input`**，`maxLength={16}`，占位「例如 🤖」；前端仅 **trim**，非法展示由用户纠正；**不做**完整 emoji 校验库（降低依赖）。列表/标题区用 `span` 原样渲染（`text-lg`/`text-xl` 放大图标区）。 |
| **D6 边界** | 助手已删：展示 **`Tag` 红色边框或 `text-zinc-500`** 文案 **「助手已删除」**，不展示空白。知识库已删：编辑页多选里该项消失；若助手仍关联已删库 ID，列表可显示 **「含无效知识库」** 小字（amber，`text-xs`），保存时由后端清理或提示。 |

**视觉**：管理端与现有 **ConsoleProShell / 知识库页** 一致：`PageContainer`、卡片、`violet` 主按钮、`zinc` 中性色。

---

## 2. 路由与导航

| 路径 | 页面职责 |
|------|----------|
| `/console/assistants` | 助手表格列表；新建；编辑/删除入口。 |
| `/console/assistants/new` | 新建表单（名称、提示词、知识库多选、emoji、快捷语列表）。 |
| `/console/assistants/[assistantId]` | 编辑同构表单；加载助手详情；删除。 |

- **`ConsoleProShell`**：`routes` 增加一项：**`path: "/console/assistants"`**，**`name: "助手"`**，图标建议 **`RobotOutlined`**（`@ant-design/icons`）。  
- **`PAGE_TITLE`**：增加 `/console/assistants` → `助手`；`/console/assistants/new` → `新建助手`；`/console/assistants/[assistantId]` → `编辑助手`（或动态显示助手名称，可选增强）。

---

## 3. 管理端：字段与控件

| 字段 | 规则（首版） | 控件 |
|------|----------------|------|
| **名称** | 必填；trim 后 **1～80** 字符 | `Input` |
| **提示词** | 必填；trim 后 **1～32_000** 字符 | `Input.TextArea`，`rows={8}`，`showCount`（若 antd 版本支持）或脚注说明字数 |
| **关联知识库** | **可不选**（空数组）；多选 **0～N**（上限 **16** 防误选） | `Select mode="multiple"`，选项来自 `GET` 知识库列表 API（与现有控制台一致） |
| **图标（emoji）** | 可选；trim 后 **0～16** 字符；空则列表与对话区用 **默认占位**「🤖」或「·」 | `Input` + 占位说明 |
| **快捷语** | **可不配置**（0 条）；若有则每条 trim 后 **1～200** 字符；**最多 20** 条；**去重** | **动态列表**：可无行；「添加一条」再增行；每行 `Input` + 删除图标 |

- **保存**：主按钮 **「保存」**；返回列表或 `message.success`。  
- **删除**：编辑页底部 **危险按钮「删除助手」** → `Modal.confirm`，文案含 **「已有会话可能仍引用该助手」**（与 PRD 一致）。

---

## 4. 对话端：流程与状态

### 4.1 新建会话（US-C1）

1. 用户点击侧栏 **「新会话」**（或等价入口）。  
2. 打开 **助手选择 Modal**（见 §1 D2）。  
3. 默认选中 **「无助手」**。  
4. 用户可选其他助手 → 点击 **「创建会话」** → `POST /api/chat/sessions` body `{ assistantId?: string }`。  
5. 成功后：关闭 Modal、`activeSessionId` 切到新会话、拉取消息（空列表）。  
6. **禁止**：创建完成后在会话内提供「更换助手」入口。

### 4.2 当前会话展示（US-C2）

- 若 `session.assistantId` 存在且助手仍有效：**emoji + 名称**（数据来自会话详情接口返回的 **嵌套助手摘要** 或独立字段，由后端定；见 backend 文档）。  
- 若助手已删除：展示 **「助手已删除」**（或后端返回 `assistantSnapshot` 名称时的折中展示）。

### 4.3 快捷语（US-C3）

- 条件：`assistantId` 存在且助手 `quickPhrases.length > 0`（由 **拉取助手详情** 或 **会话 bootstrap 接口** 附带，避免额外请求风暴；后端定）。  
- 布局：输入框 **上方**；小按钮排布见 §1 D4。  
- 点击：**仅填入 `input`**，焦点落入 `textarea` 末尾（可选 `textareaRef.focus()`）。

---

## 5. 状态与异常

| 状态 | 表现 |
|------|------|
| 加载助手列表（Modal 内） | `Select` `loading` 或 Spin |
| 创建会话失败 | `message.error` + Modal **不关闭** |
| 无知识库可选 | 多选为空数组提示 **「暂无知识库，请先在知识库中创建」**（`text-sm text-zinc-500`） |
| 会话列表加载中 | 保持现有 ChatApp 骨架，不阻塞 Modal（Modal 仅在用户点击新会话时打开） |

---

## 6. 可访问性

- Modal：**焦点陷阱**由 antd `Modal` 默认行为处理；主按钮 **「创建会话」** 为 `type="primary"`。  
- 助手只读 `Tag`：若仅装饰性，可 `aria-hidden`；若传达信息，用 **`aria-label`**：`当前助手：{name}`。  
- 快捷语按钮：`aria-label` 含完整快捷语文案（避免仅显示截断时读屏不完整）。

---

## 7. 与需求 / 故事的对应

| 故事 ID | 设计落点 |
|---------|----------|
| US-A1 | §2 路由 + §3 列表页（ProTable 或 Table） |
| US-A2 | §3 表单 + `/new`、`/[id]` |
| US-A3 | §3 删除确认文案 |
| US-C1 | §4.1 Modal + 创建 API |
| US-C2 | §4.2 标题栏 Tag |
| US-C3 | §4.3 + §1 D4 |

---

## 8. 非目标（设计侧）

- 助手 **封面图**、**Markdown 富文本提示词预览**（首版纯文本即可）。  
- 对话内 **助手市场**、**搜索助手**。
