# iter-09 — 知识库 RAG

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-09`  
> **状态：** **已发布**  
> **路线图阶段：** 2 — 知识库  
> **计划发布：** 2026-07-01  
> **实际发布：** 2026-07-01  
> **Git tag（可选）：** `iter-09`

---

## 1. 迭代目标

- [x] Console 知识库 CRUD、单 source 上传/粘贴、异步入库（解析 → 分片 → 向量化）
- [x] Preferences 召回参数；Assistants 多 KB 绑定
- [x] Chat workflow：`rag_query_optimize` + `rag_retrieve` 节点与召回测试
- [x] Supabase pgvector + RLS；iter-06–08 回归通过

---

## 2. 范围

### In Scope

| 区域 | 变更 |
|------|------|
| `knowledge-base` | Console KB 管理、入库、召回测试、向量存储 |
| `console` | Profile RAG Preferences；Assistants KB 多选；Models **model type** + Embedding 可配置 |
| `agent-orchestration` | RAG workflow 两节点 + Chat 步骤 UI |
| DB | `knowledge_bases`、chunks/embeddings、助理绑定表、pgvector、`user_model_configs.model_type` |
| 测试 | 单元 122 + E2E 25（3 skipped）+ iter-06–08 回归 |

### Out of Scope

- MCP / Skills 节点
- KB 版本管理、多 source 混用
- 组织级 KB 共享
- 可视化 Workflow 编辑器
- 批量全库 re-embed / 切换已有 KB embedding 模型

---

## 3. 包含的 Features

| Slug | Changelog | 状态 |
|------|-----------|------|
| `knowledge-base` | [changelog/iter-09-cn.md](../../features/knowledge-base/changelog/iter-09-cn.md) | **已发布** |
| `console`（增量） | 见 changelog §1 · [models-cn §3.10](../../features/console/prd/models-cn.md) | **已发布** |
| `agent-orchestration`（增量） | 见 changelog §1 | **已发布** |

**必读 PRD：** [knowledge-base README-cn.md](../../features/knowledge-base/README-cn.md)

---

## 4. 验收

### 4.1 自动化

- [x] `pnpm lint` — 2026-07-01
- [x] `pnpm build` — 2026-07-01
- [x] `pnpm test` — 122 passed
- [x] `pnpm test:e2e` — `CI=1`；25 passed，3 skipped

### 4.2 手工 QA

- [x] AC-90–100 — [changelog §5 / §12](../../features/knowledge-base/changelog/iter-09-cn.md)（M-01 PDF skipped）

### 4.3 发布

- [x] changelog §5 AC 已全部勾选（qa-engineer · 2026-07-01）
- [x] 迭代完成确认（2026-07-01）

### 4.4 发布后补丁（§10）

> [changelog §10](../../features/knowledge-base/changelog/iter-09-cn.md)

| 类别 | 摘要 |
|------|------|
| 文案 | Embedding 变更确认框：明确 Retry ingestion **不**切换 KB embedding |
| KB 列表 UI | View 增加 Eye icon；Name/Description/Source `line-clamp-2`；Actions 两行 |
| Models UI | Source「Platform default」pill 单行不换行 |

### 4.5 iter-10 承接（2026-07-02 → **已发布 2026-07-03**）

iter-09 关闭后的 UX / RAG 调优已交付 **[iter-10](../iter-10/README-cn.md)**。见各 feature `changelog/iter-10-cn.md`。

---

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | iter-08 已发布；Workflow Registry 可扩展节点 |
| 已缓解 | 大文件入库 → 异步 job + `maxDuration=300`；PDF 生产 → `serverExternalPackages` |
| 已缓解 | BGE-M3 阈值 → 代码默认 0.65 / TopK 3 |
| 运营注意 | **已入库 KB** 需 Retry ingestion 才应用新分片算法（MAN-03） |
| 技术债（可选） | DB profile 默认 0.55 vs 代码 0.65；M-01 PDF 本地补测 |

---

## 6. 门禁记录

| 日期 | 事件 |
|------|------|
| 2026-06-30 | PRD 已确认（用户对焦 6 项开放问题） |
| 2026-06-30 | 技术设计已确认 |
| 2026-06-30 | Phase B 编码交付（含 changelog §8 手工优化） |
| 2026-07-01 | qa C0–C4：AC-90–100 全部勾选；122 unit + 25 e2e |
| 2026-07-01 | 发布后补丁 §10（文案 / KB 列表 / Models pill） |
| 2026-07-01 | **迭代已发布** |

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | 创建 iter-09 |
| 2026-06-30 | 同步 changelog §7–§9；OPT-11；QA 矩阵 |
| 2026-07-01 | QA 验收通过；§10 发布后补丁；标 **已发布** |
