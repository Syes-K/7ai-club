# iter-07 — 历史对话摘要

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-07`  
> **状态：** **已发布**  
> **路线图阶段：** 2 — Agent 编排  
> **计划发布：** 2026-06-26  
> **实际发布：** 2026-06-26  
> **Git tag（可选）：** `iter-07`

---

## 1. 迭代目标

- [x] 用户可在 Preferences 配置对话摘要策略与摘要模型
- [x] Workflow 新增 3 个摘要 Node（加载 / 评估 / 执行）
- [x] 长对话超阈值时滚动摘要 + 软归档；Clear chat 清 memory
- [x] 步骤时间线 inline 展开摘要详情
- [x] iter-05/06 行为回归通过

---

## 2. 范围

### In Scope

| 区域 | 变更 |
|------|------|
| `agent-orchestration` | 滚动摘要 PRD、Workflow nodes、DB、步骤 UI |
| `console` | Preferences Conversation memory |
| `mvp-chat` | Clear chat 扩展 + 聊天贴底 |
| 测试 | 单元 + E2E |

### Out of Scope

- 按助理不同摘要策略  
- 摘要多版本历史 Drawer  
- 对话区 Memory 系统消息  
- RAG / MCP  

---

## 3. 包含的 Features

| Slug | Changelog | 状态 |
|------|-----------|------|
| `agent-orchestration` | [changelog/iter-07-cn.md](../../features/agent-orchestration/changelog/iter-07-cn.md) | **已发布** |
| `console` | [changelog/iter-07-cn.md](../../features/console/changelog/iter-07-cn.md) | **已发布** |
| `mvp-chat` | [changelog/iter-07-cn.md](../../features/mvp-chat/changelog/iter-07-cn.md) | **已发布** |

**必读 PRD：**

1. [agent-orchestration/prd/history-summarization-cn.md](../../features/agent-orchestration/prd/history-summarization-cn.md)
2. [console/prd/profile-cn.md](../../features/console/prd/profile-cn.md) §3.4
3. [mvp-chat/prd/chat-experience-cn.md](../../features/mvp-chat/prd/chat-experience-cn.md) F-14

---

## 4. 验收

### 4.1 自动化

- [x] `pnpm lint` 通过（2026-06-26）
- [x] `pnpm build` 通过（2026-06-26）
- [x] `pnpm test` 通过 · 73（2026-06-26）
- [x] `pnpm test:e2e` 通过 · 13（2026-06-26，`CI=1`）
- [x] `pnpm test:ci` 通过（lint + build + unit + e2e 分项复验）

### 4.2 手工 QA

- [x] AC-70–77 — [agent-orchestration changelog §5](../../features/agent-orchestration/changelog/iter-07-cn.md)
- [x] M-01–M-09 — [changelog §12](../../features/agent-orchestration/changelog/iter-07-cn.md)

### 4.3 发布

- [x] AC-70–77 已全部勾选
- [x] qa-engineer 验收完成 · 本地迭代发布（2026-06-26）

---

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | iter-06 已发布；iter-05 Preferences / Models |
| 风险 | 摘要 LLM 额外延迟 → 仅超阈值时触发 |
| 已缓解 | 软归档 RLS、workflow run 匹配、UUID 写入 — 见 [changelog §7](../../features/agent-orchestration/changelog/iter-07-cn.md) |
| 已知限制 | Evaluating turn 展示偶发少 1 — 见 changelog §10 P2 |

---

## 6. 门禁记录

| 日期 | 事件 |
|------|------|
| 2026-06-25 | PRD 已确认 |
| 2026-06-25 | 技术设计已确认，开始编码 |
| 2026-06-25 | 编码交付；开发期 H-01–H-07 修复 |
| 2026-06-26 | 自动化 + qa-engineer 手工 QA 通过 |
| 2026-06-26 | **迭代已发布** |

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-25 | 创建 iter-07；PRD 已确认 |
| 2026-06-25 | 编码完成；同步 changelog §6–§10 |
| 2026-06-26 | 验收通过；状态 → **已发布** |
