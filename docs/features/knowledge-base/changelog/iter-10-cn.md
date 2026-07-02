# iter-10 变更摘要 — knowledge-base（RAG 调优 · Recall UX）

> **English:** [iter-10.md](./iter-10.md)  
> **中文：** [iter-10-cn.md](./iter-10-cn.md)  
> **迭代索引：** [iter-10/README-cn.md](../../iterations/iter-10/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| Query optimization 偏好 | [prd/rag-preferences-cn.md](../prd/rag-preferences-cn.md) §3.3 iter-10 | [design/console-rag-integration-cn.md](../design/console-rag-integration-cn.md) |
| Recall test 弹窗 | [prd/kb-recall-test-cn.md](../prd/kb-recall-test-cn.md) | [design/kb-console-cn.md](../design/kb-console-cn.md) |
| Chat RAG 节点条件 | [prd/chat-rag-nodes-cn.md](../prd/chat-rag-nodes-cn.md) §3.3 iter-10 | [design/chat-rag-nodes-cn.md](../design/chat-rag-nodes-cn.md) |

---

## 2. 必读

1. [changelog/iter-09-cn.md](./iter-09-cn.md) — iter-09 RAG 基线  
2. [prd/rag-preferences-cn.md](../prd/rag-preferences-cn.md)  
3. [iter-10/README-cn.md](../../iterations/iter-10/README-cn.md)

---

## 3. 计划交付

| 区域 | 路径 / 说明 |
|------|-------------|
| DB | `supabase/migrations/20260702000000_rag_query_optimize_enabled.sql` |
| Profile | `preferences-card.tsx` · validation · browser/server profile |
| Chat workflow | `app/api/chat/route.ts` · `validate-request.ts` |
| Recall test | `knowledge-base-recall-test-dialog.tsx` · list + detail 页复用 |
| Hints | `lib/rag/recall-hints.ts` |
| 单元测试 | `recall-hints.test.ts` · `defaults.test.ts` · `profile-validation.test.ts` |

### 3.1 实际交付（Phase B）

| ID | 项 | 说明 |
|----|-----|------|
| R-01 | **Query optimization 默认关** | `DEFAULT_RAG_QUERY_OPTIMIZE_ENABLED = false`；DB column default false |
| R-02 | Preferences 复选框 + FieldHint | Edit/Save；View 显示 Enabled/Disabled |
| R-03 | Chat 条件节点 | `rag_query_optimize_enabled` → 插入或跳过 `rag_query_optimize` |
| R-04 | Recall test 独立 Dialog | 从 list/detail 打开；含 threshold/topK/query optimize 覆盖 |
| R-05 | 空召回 hint | 按 **KB 锁定** 的 `embedding_provider/model` 提示，非硬编码 BGE-M3 |
| R-06 | KB detail 精简 | Recall 逻辑迁至共享 dialog |

---

## 4. 产品决策记录（iter-10 已确认）

| 项 | 决策 |
|----|------|
| 默认行为 | Query optimization **默认关闭** — 原文向量检索；精确短语测试更可靠 |
| 开启后 | Chat 与 iter-09 相同：插入 `rag_query_optimize` → `rag_retrieve` |
| Recall test | 弹窗内可 **临时覆盖** query optimize；默认读取 Profile |
| 空结果提示 | 显示 KB 实际 embedding 模型名 + 建议 threshold（有 bestScore 时） |
| iter-09 兼容 | 已有 Profile 无列 → migration + 代码 fallback **false** |

---

## 5. 验收清单

### 摘要（AC 一览）

- [x] **AC-106** — Preferences Query optimization 默认 Disabled，可 Save
- [x] **AC-107** — 关闭时 Chat 无 Optimizing query 步骤（绑定 KB）
- [x] **AC-108** — Recall test 弹窗：Run、query optimize 覆盖、结果表
- [x] **AC-109** — 空召回 hint 含 KB embedding 模型名

### 5.1 Test Matrix

| AC ID | 前提 | 操作步骤 | 期望结果 | 验证方式 | 自动化覆盖 | 证据 |
|-------|------|----------|----------|----------|------------|------|
| AC-106 | 测试账号 | 1. Profile → RAG 2. View Query optimization | 默认 **Disabled** 3. Edit 勾选 → Save → View Enabled | e2e + unit | `profile-validation.test.ts` · `iter10-polish` | pass · 2026-07-03 |
| AC-107 | Assistant 绑 Ready KB；Pref optimize **关** | 1. Chat 发消息 2. 展开 workflow | 无 **Optimizing query**；有 **Retrieving knowledge** | e2e | `iter10-polish` AC-107 | pass · 2026-07-03 |
| AC-107b | Pref optimize **开** | 同 AC-107 | 两步均有 | manual | iter-09 M-03 回归 | pass · 手工 |
| AC-108 | Ready KB | 1. KB 列表 Recall test 2. Run | Dialog 打开；可调 threshold；有 hits 或空提示 | e2e | `iter09`/`iter10` recall | pass · placeholder 选择器 |
| AC-109 | Ready KB；故意高 threshold 无命中 | 1. Recall test Run | 空结果区 hint 含 `provider · model`（KB 锁定模型） | unit + manual | `recall-hints.test.ts` | pass · unit |

---

## 6. 门禁与阶段状态

| 阶段 | 状态 | 日期 |
|------|------|------|
| 编码 Phase B | 完成 | 2026-07-02 |
| 测试 C0 | Matrix 落盘 | 2026-07-02 |
| 测试 C1–C3 | 通过 | 2026-07-03 |
| 发布 | **已发布** | 2026-07-03 |

---

## 12. 手工 QA 脚本

| # | 映射 AC | 场景 | 步骤 | 期望 | 结果 | 证据 |
|---|---------|------|------|------|------|------|
| M-106 | AC-106 | 默认关 | Profile View RAG | Query optimization: Disabled | pass | e2e AC-106 |
| M-107 | AC-107 | Chat 无 optimize | Pref 关 + KB 聊天 | workflow 无 Optimizing query | pass | e2e AC-107 |
| M-108 | AC-108 | Recall 弹窗 | 列表点 Recall test | 弹窗非 inline；Run 可用 | pass | iter09+iter10 e2e |
| M-109 | AC-109 | Hint 模型名 | 高 threshold 空结果 | hint 非固定 BGE-M3 文案 | pass | `recall-hints.test.ts` |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-02 | 创建 iter-10 knowledge-base changelog |
| 2026-07-03 | QA C4：AC-106–109 勾选 |
