# iter-02 变更摘要 — mvp-chat

> **English:** [iter-02.md](./iter-02.md)  
> **迭代索引：** [iter-02/README-cn.md](../../iterations/iter-02/README-cn.md)

---

## 1. 本迭代交付主题

| 主题 | PRD | 设计 |
|------|-----|------|
| 营销首页 + C2 视觉 + 顶栏用户 | [prd/landing-cn.md](../prd/landing-cn.md) | [design/landing-cn.md](../design/landing-cn.md) |
| 删除 / 清空 / Markdown / 侧栏与输入 UX | [prd/chat-experience-cn.md](../prd/chat-experience-cn.md) | [design/chat-experience-cn.md](../design/chat-experience-cn.md) |
| 百炼 abort + 错误提示 | [prd/llm-reliability-cn.md](../prd/llm-reliability-cn.md) | [design/llm-reliability-cn.md](../design/llm-reliability-cn.md) |

---

## 2. 本地实现摘要（2026-06-16）

### 2.1 Landing + 顶栏

| 项 | 实现 |
|----|------|
| `/` 公开 Landing | `app/page.tsx`，Hero 居中，能力网格，页脚 |
| 不 auto-redirect | 已登录访问 `/` 仍见 Landing；`middleware.ts` 移除 `/` → `/chat` |
| C2 tokens | `app/globals.css`；JetBrains Mono + Inter |
| `SiteHeader` | 全宽顶栏；Chat / Sign in / Register；`compactUserMenu` 头像下拉 |
| 登录回跳 | `?next=/chat` — `auth-form.tsx`、`login/page.tsx` |
| Start chat CTA | 未登录 → `/login?next=/chat`；已登录 → `/chat` |

### 2.2 Chat 体验

| 项 | 实现 |
|----|------|
| 删除对话 | `DELETE /api/conversations/[id]` + 侧栏确认 Dialog |
| 清空聊天记录 | `DELETE /api/conversations/[id]/messages` + 子栏 Clear chat |
| Markdown | `markdown-content.tsx`；流式结束后切 MD |
| system_prompt | migration `20260615000000_iter02_assistant_markdown_prompt.sql` |
| messages DELETE RLS | migration `20260616000000_messages_delete_own.sql` |
| 侧栏三行卡片 | 标题 + assistant name + `YYYY-MM-DD HH:mm`（`listConversations` join `assistants`） |
| 侧栏刷新 | 每轮对话完成后 `router.refresh()` 更新标题与时间 |
| Chat 子栏 | 助理名/模型左对齐；Clear chat 图标按钮（`CHAT_ACTION_RAIL` 对齐） |
| 输入框 | 2 行 + 右下角悬浮圆形发送按钮（neon 光晕） |
| Thinking 态 | Bot 头像 + 脉冲点 + `Thinking.` / `..` / `...` 循环（450ms） |
| New chat | `secondary` neon 描边（非整片绿色） |
| 消息区宽度 | 去掉 `max-w-3xl`，占满主栏 |

### 2.3 LLM 可靠性

| 项 | 实现 |
|----|------|
| chunk 超时 | 15s → 60s；`LLM_CHUNK_TIMEOUT_MS` 可覆盖 |
| 百炼思考模式 | `lib/llm/stream-options.ts` — `enable_thinking: false` |
| 错误分类 | `lib/llm/errors.ts` + `lib/chat/fetch-with-error.ts` 用户文案 |

### 2.4 新增 / 主要文件

```
app/page.tsx
app/api/conversations/[id]/route.ts
app/api/conversations/[id]/messages/route.ts
components/layout/site-header.tsx
components/layout/user-menu.tsx
components/landing/*
components/chat/markdown-content.tsx
components/chat/delete-conversation-dialog.tsx
components/chat/clear-chat-dialog.tsx
components/ui/grid-background.tsx
lib/auth/user-display.ts
lib/chat/format.ts
lib/constants/landing.ts
lib/constants/landing-layout.ts
lib/constants/chat-layout.ts
lib/llm/errors.ts
lib/llm/stream-options.ts
supabase/migrations/20260615000000_iter02_assistant_markdown_prompt.sql
supabase/migrations/20260616000000_messages_delete_own.sql
```

---

## 3. 验收清单（iter-02）

### 代码已实现 · 待本地/Staging 手测

- [x] **AC-10** – **AC-13**、**AC-18** → [landing-cn.md](../prd/landing-cn.md)
- [x] **AC-14** – **AC-17**、**AC-21** → [chat-experience-cn.md](../prd/chat-experience-cn.md)
- [x] **AC-19** – **AC-20**（代码）→ [llm-reliability-cn.md](../prd/llm-reliability-cn.md)；**百炼需真机流式复测**

---

## 4. 技术设计状态

| 模块 | 设计文档 | 状态 |
|------|----------|------|
| iter-01 核心 | [design/core-chat-cn.md](../design/core-chat-cn.md) | 已确认 |
| Landing | [design/landing-cn.md](../design/landing-cn.md) | **已实现（本地）** |
| Chat 体验 | [design/chat-experience-cn.md](../design/chat-experience-cn.md) | **已实现（本地）** |
| LLM | [design/llm-reliability-cn.md](../design/llm-reliability-cn.md) | **已实现（本地）** |

---

## 5. 完成本地迭代前检查

| # | 项 | 说明 |
|---|-----|------|
| 1 | Supabase migration | 执行 `20260615000000_*` 与 `20260616000000_*` |
| 2 | `pnpm build` | 已通过 |
| 3 | Landing | `/` 不跳转；Start chat / 顶栏 Chat |
| 4 | 用户菜单 | 头像下拉；完整邮箱 + Sign out |
| 5 | 删除 / 清空 | 确认框；RLS；清空后标题 `New Chat` |
| 6 | Markdown | 用户 + AI 代码块；流式后格式化 |
| 7 | 侧栏 | 首轮对话后标题与时间更新 |
| 8 | 百炼 | `LLM_PROVIDER=bailian` 长回复流式无 abort |
| 9 | Git | 确认变更范围后提交（可选 tag `iter-02`） |

---

## 6. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-15 | iter-02 PRD 分层后创建 |
| 2026-06-16 | 本地实现完成；补充 UX 增强与完成检查清单 |
