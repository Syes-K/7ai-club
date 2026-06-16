# iter-02 — 首页、Chat 体验与 LLM 加固

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-02`  
> **状态：** **本地实现完成 · 待手测与 migration**  
> **路线图阶段：** 1 — MVP 聊天（体验升级）  
> **计划发布：** —  
> **实际发布：** —  
> **Git tag（可选）：** `iter-02`

---

## 1. 迭代目标

- [x] 交付营销首页（内容参考 [7ai.club/en](https://7ai.club/en)），含 **Start chat** 入口
- [x] Chat 体验升级：删除对话、清空聊天、Markdown、C2 视觉、侧栏卡片、输入框与 Thinking UX
- [x] 修复百炼（`bailian`）+ `qwen3.6-plus` 流式 abort；改进 LLM 错误提示（代码已合入，需百炼复测）

---

## 2. 范围

### In Scope（已交付 · 本地）

**首页 & 导航**

- `/` 营销 Landing（不 `redirect("/chat")`）
- Hero 居中、能力 `[01]`–`[04]`、页脚
- **Start chat** / 顶栏 Chat；`?next=/chat` 登录回跳
- 全宽 `SiteHeader`；头像下拉用户菜单（compact）

**Chat 优化**

- 侧栏删除 + 二次确认；子栏 **Clear chat** + 确认
- 用户 + AI **Markdown**；默认助理 `system_prompt` migration
- 侧栏：**标题 + assistant name + 最后活动时间**
- 对话完成后 **refresh** 更新侧栏
- C2 Electric Ocean 换肤；子栏左对齐；全宽消息区
- 2 行输入框 + 悬浮 neon 发送按钮；Thinking 指示器

**LLM 加固**

- chunk 超时 60s（`LLM_CHUNK_TIMEOUT_MS` 可配）
- 百炼 `enable_thinking: false`
- 错误分类与用户 English 文案

### Out of Scope（本迭代不做）

- Console / 管理后台
- 应用内模型切换 UI
- 助理 CRUD、RAG、MCP
- 软删除 / 回收站
- 流式增量 MD 解析

---

## 3. 包含的 Features

| Feature slug | 变更摘要 | 状态 |
|--------------|----------|------|
| `mvp-chat` | [changelog/iter-02-cn.md](../../features/mvp-chat/changelog/iter-02-cn.md) | **本地完成** |

功能概览：[docs/features/mvp-chat/README-cn.md](../../features/mvp-chat/README-cn.md)

---

## 4. 视觉方向（已选）

**C2 · Electric Ocean** — 霓虹蓝主色、深海军蓝背景；Chat 内主操作为 neon 蓝（非侧栏整片绿）。

---

## 5. 待办（Todos）

| ID | 任务 | 状态 |
|----|------|------|
| T-10 | PRD v0.3 分层 | 已完成 |
| T-11 | 技术设计三模块 | 已完成 |
| T-12 | 首页 Landing | **已完成** |
| T-13 | Chat 删除对话 | **已完成** |
| T-14 | Markdown 渲染 | **已完成** |
| T-15 | C2 视觉统一 | **已完成** |
| T-16 | 用户展示（头像下拉） | **已完成** |
| T-17 | 清空聊天 + 侧栏卡片 + 输入/Thinking UX | **已完成**（迭代内增强） |
| T-01 | 百炼 abort 根因 | **已完成**（chunk + thinking） |
| T-02 | 百炼修复 | **已完成** |
| T-03 | 地域校验 | **已完成**（errors.ts） |
| T-04 | 错误提示 | **已完成** |
| T-18 | Supabase migration 执行 | **待办** |
| T-19 | 手测验收 + git 提交 | **待办** |

---

## 6. 迭代验收标准

- [x] `/` 展示 Landing，不 auto-redirect
- [x] Start chat / 顶栏 Chat；未登录引导登录
- [x] 已登录用户右上角头像菜单
- [x] 侧栏删除对话（确认、RLS）
- [x] Clear chat（确认、标题重置）
- [x] 双向 Markdown（含代码块）
- [x] Chat 与首页 C2 一致
- [ ] 百炼流式稳定（**需本地/Staging 复测 AC-19**）
- [x] 侧栏标题与时间首轮对话后更新

---

## 7. 完成本地迭代 — 操作清单

1. **Supabase SQL Editor** 依次执行：
   - `supabase/migrations/20260615000000_iter02_assistant_markdown_prompt.sql`
   - `supabase/migrations/20260616000000_messages_delete_own.sql`
2. **`pnpm dev`** 按 [changelog §5](../../features/mvp-chat/changelog/iter-02-cn.md) 手测
3. **`pnpm build`** 确认通过
4. **Git** 审查 diff → commit（建议信息：`feat(iter-02): landing, chat UX, LLM hardening`）
5. 可选：`git tag iter-02`

---

## 8. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | iter-01 认证、Chat API、RLS |
| 风险 | 未跑 migration → 清空聊天失败、旧 system_prompt |
| 风险 | 百炼长思考场景 → 依赖 60s chunk + 关闭 thinking |

---

## 9. 发布记录

| 日期 | 事件 | 备注 |
|------|------|------|
| 2026-06-15 | 创建 iter-02 backlog | |
| 2026-06-15 | 扩大范围 | 首页 + Chat 体验 |
| 2026-06-16 | **本地实现完成** | 见 changelog |

---

## 10. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-15 | 创建 iter-02 |
| 2026-06-16 | 标记本地完成；Todos / 验收 / 操作清单 |
