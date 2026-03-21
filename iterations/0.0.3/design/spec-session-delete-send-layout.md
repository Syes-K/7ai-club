# 设计说明：会话删除与发送按钮悬浮（version=0.0.3）

**输入需求**：`iterations/0.0.3/product/prd-session-delete-send-layout.md`、`user-stories-session-delete-send-layout.md`  
**基线**：`docs/design/spec-chat-sessions-sqlite.md`（0.0.2）、`docs/design/spec-chat-layout-buttons.md`（0.0.1）

---

## 1. 设计决策（D1～D3 定稿）

### D1 删除确认

| 决策 | 内容 |
|------|------|
| **形式** | 首版使用浏览器原生 **`window.confirm`**，降低实现成本；文案固定为下文，便于测试与无障碍读屏（系统对话框由 OS 接管）。后续若需品牌化，可替换为页面内 Modal，**不改变**确认/取消语义。 |
| **标题/文案** | 建议：`确定删除此会话？`（主文）；说明：`删除后无法恢复，该会话中的消息将一并删除。` 若平台 `confirm` 仅支持单段字符串，则合并为一段：`确定删除此会话？删除后无法恢复。` |
| **进行中** | 确认后至请求完成前：**禁用**该条删除按钮与侧栏内其他删除按钮（或全局侧栏 `pointer-events-none` 与 0.0.2 `busy` 策略叠加时，以「不重复发起删除」为准）；**禁止**在删除请求进行中再次打开第二个确认框（忽略连点）。 |

### D2 输入区与发送按钮（右下角悬浮）

| 决策 | 内容 |
|------|------|
| **结构** | Footer 内一层 **`relative`** 容器包裹 **`textarea`** + **发送按钮**；容器 `max-w-3xl mx-auto` 与现网一致，与主消息区对齐。 |
| **按钮位置** | 发送按钮 **`absolute bottom-3 right-3`**（`0.75rem`）；`z-index` 高于 `textarea`（如 `z-10`），呈「叠在输入区右下角」的悬浮感。 |
| **按钮形态** | 保持 0.0.1：**圆角** `rounded-xl`、**violet 实心**、**图标 +「发送」**；尺寸略缩为适合角标：`px-3 py-2`、`text-sm`，图标 `16px`，与现网同一套线框 `SendIcon`。 |
| **textarea 留白** | **`padding-bottom: 3rem`（`pb-12`）** 与 **`padding-right: 5.5rem`（`pr-[5.5rem]`）**，保证末行与右侧文字**不被按钮遮挡**；可随按钮宽度微调 `pr`。 |
| **最小高度** | 维持 `min-h-[5rem]`（约三行），`resize-y` 保留。 |
| **深色模式** | 容器底栏背景仍为 `bg-white` / `dark:bg-zinc-900`；`textarea` 与现网一致；按钮 hover/disabled 与 0.0.1 相同。 |

### D3 侧栏删除控件

| 决策 | 内容 |
|------|------|
| **布局** | 每条会话为 **`flex` 行**：左侧为**主点击区**（标题 + 时间，占满剩余宽度，行为同现网「切换会话」）；右侧为 **删除图标按钮**（`shrink-0`），与主区 **`gap-1`**。 |
| **删除按钮** | **垃圾桶线框图标**（与顶栏「清空对话」同款 `TrashIcon` 或同规格 16px），**仅图标**，`aria-label="删除会话"`；`rounded-lg`、`p-1.5`，`text-zinc-500` hover `text-red-600` / `hover:bg-zinc-200`（深色：`dark:hover:bg-zinc-800`）。 |
| **误触** | 删除 **`type="button"`**，**`e.stopPropagation()`**（或不在主 `button` 内嵌套）避免触发行切换。 |
| **当前项** | 激活会话行仍保留左边框高亮；删除按钮在激活/非激活态下样式一致，仅 hover 强调。 |
| **busy** | 与 0.0.2 一致：侧栏整体禁用交互时删除按钮一并禁用；删除**单独 loading** 时也可只禁用删除图标（实现任选，验收：不重复删）。 |

---

## 2. 用户故事映射

| 故事 | 设计落点 |
|------|----------|
| US-1 | D1 + D3：确认文案 + 行内删除图标 |
| US-2 | 产品逻辑；设计无额外界面，仅保证删除后列表项消失不残留焦点陷阱 |
| US-3 | D2：`relative` 容器 + `absolute` 发送 + `textarea` 内边距 |

---

## 3. 与后端交接（设计侧）

- 删除成功后前端需 **刷新会话列表** 并处理**当前会话被删**的选中态（见 PRD）；不新增 UI 组件要求。

---

## 4. 实现路径（建议）

- `SessionSidebar.tsx` / `SessionPanelInner`：行布局 + `onDeleteSession(id)` 回调由 `ChatApp` 注入。  
- `ChatApp.tsx`：footer 输入区改为相对定位 + 绝对定位发送钮。

---

## 5. 文档路径

- 迭代：`iterations/0.0.3/design/spec-session-delete-send-layout.md`
- 同步：`docs/design/spec-session-delete-send-layout.md`
