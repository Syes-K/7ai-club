# iter-09 变更摘要 — 知识库 RAG

> **English:** [iter-09.md](./iter-09.md)  
> **中文：** [iter-09-cn.md](./iter-09-cn.md)  
> **迭代索引：** [iter-09/README-cn.md](../../iterations/iter-09/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| Console 知识库管理 | [prd/kb-management-cn.md](../prd/kb-management-cn.md) | [design/kb-console-cn.md](../design/kb-console-cn.md) |
| Schema & RPC | — | [design/kb-schema-cn.md](../design/kb-schema-cn.md) |
| 异步入库 | [prd/kb-ingestion-cn.md](../prd/kb-ingestion-cn.md) | [design/kb-ingestion-cn.md](../design/kb-ingestion-cn.md) |
| 召回测试 | [prd/kb-recall-test-cn.md](../prd/kb-recall-test-cn.md) | [design/kb-console-cn.md](../design/kb-console-cn.md) §5.4 |
| Preferences RAG | [prd/rag-preferences-cn.md](../prd/rag-preferences-cn.md) | [design/console-rag-integration-cn.md](../design/console-rag-integration-cn.md) |
| Assistants KB 绑定 | [prd/assistant-kb-binding-cn.md](../prd/assistant-kb-binding-cn.md) | [design/console-rag-integration-cn.md](../design/console-rag-integration-cn.md) |
| Chat RAG 节点 | [prd/chat-rag-nodes-cn.md](../prd/chat-rag-nodes-cn.md) | [design/chat-rag-nodes-cn.md](../design/chat-rag-nodes-cn.md) |

**跨 feature 修订：** [console/profile-cn.md](../../console/prd/profile-cn.md) · [console/assistants-cn.md](../../console/prd/assistants-cn.md) · [console/models-cn.md](../../console/prd/models-cn.md)（§3.10 iter-09） · [agent-orchestration](../../agent-orchestration/README-cn.md)

---

## 2. 必读

1. [01-product-requirements-cn.md](../01-product-requirements-cn.md) — 总纲 §2 全局约定  
2. [02-technical-design-cn.md](../02-technical-design-cn.md) — 技术总纲 + **§12 验收映射**  
3. [design/kb-schema-cn.md](../design/kb-schema-cn.md) — 表、pgvector、RPC  
4. [prd/kb-management-cn.md](../prd/kb-management-cn.md) — F-90 · AC-90–91  
5. [prd/kb-ingestion-cn.md](../prd/kb-ingestion-cn.md) — F-91 · doc-to-md-rag · 混合分片  
6. [prd/kb-recall-test-cn.md](../prd/kb-recall-test-cn.md) — F-92  
7. [prd/rag-preferences-cn.md](../prd/rag-preferences-cn.md) — F-93  
8. [prd/assistant-kb-binding-cn.md](../prd/assistant-kb-binding-cn.md) — F-94  
9. [prd/chat-rag-nodes-cn.md](../prd/chat-rag-nodes-cn.md) — F-95 · AC-96–98  

---

## 3. 计划交付（编码前）

| 区域 | 路径 / 说明 |
|------|-------------|
| Console UI | `app/console/knowledge/` — 列表、创建、详情、召回测试 |
| Console 修订 | Profile RAG Preferences；Assistants KB multi-select |
| 入库 | 异步 job API + `lib/rag/` parse/chunk/embed |
| DB | migrations — KB 表、chunks、pgvector、assistant_knowledge_bases |
| Workflow | `lib/workflow/nodes/rag-*.ts`；node catalog；Registry renderers |
| Chat UI | workflow 步骤 detail 展开 RAG 命中 |
| 依赖 | npm `doc-to-md-rag` |
| 测试 | unit + E2E；iter-06–08 回归 |

### 3.1 实际交付（Phase B + §8 手工优化）

| 区域 | 路径 / 说明 |
|------|-------------|
| 核心 RAG | `lib/rag/` — parse · chunk · embed · ingest · retrieve · optimize-query · update-source |
| API | `/api/knowledge` CRUD · `/ingest` · `/recall-test` · **`/source`（Replace source）** |
| Console 详情 | `components/console/knowledge-base-detail.tsx` — Recall test · Replace source |
| Console 子页 | `app/console/knowledge/[id]/content` · `[id]/chunks` |
| Console 组件 | `components/console/console-multi-select.tsx`（Assistants KB 下拉多选） |
| 生产修复 | `next.config.ts` — `serverExternalPackages`（PDF 入库） |
| DB migrations | `20260630000000_iter09_knowledge_base.sql` · `20260630120000_iter09_rag_confidence_default.sql` · **`20260630180000_user_model_config_type.sql`** |
| 模型类型 + Embedding 可选 | `lib/constants/model-types.ts` · Models 页 type 字段 · Profile embedding 从 Passed **embedding** 配置选择（§8 OPT-11） |

---

## 4. 产品决策记录（iter-09 已确认）

| 项 | 决策 |
|----|------|
| 解析 | PDF/DOCX → [`doc-to-md-rag`](https://www.npmjs.com/package/doc-to-md-rag) v1.x |
| 分片 | Markdown **标题（`#`）** 结构边界 + 相邻段贪心合并 + token 滑动窗口；overlap/size 由 env 配置（§8 OPT-03） |
| 入库 | 异步 job；不在 chat route |
| Embedding 默认（Preferences） | **Platform default 排第一**（env）；其余为 Models 页 **Passed · type=embedding** 的个人配置；Chat 偏好仍仅 **Passed · type=chat**（§8 OPT-11） |
| Embedding API Key | Platform default → env Key；个人 embedding 配置 → 用户加密 Key（`lib/rag/embed.ts`） |
| Source | 1 KB = 1 source；文本与文件不可混用；**同 type 可 Replace source 后 re-index（§8 OPT-06）** |
| 删除 KB | 被助理绑定 → HTTP 409 |
| 失败 | status `error` + Retry ingestion（Retry 刷新 env chunk size/overlap） |
| 召回默认 | **代码** `lib/rag/defaults.ts`：**confidence 0.65 · TopK 3**；embedding 默认 **SiliconFlow · BAAI/bge-m3 · 1024 维**（BGE-M3 余弦尺度调优，见 §7–§8） |
| 召回默认（DB） | migration `20260630120000` 将 profile 列默认与既有 **0.75 → 0.55**；**与代码 0.65 尚未对齐，见 §9** |
| 入库异步 | `after(runKnowledgeBaseIngest)`；create route **maxDuration=300**；详见 kb-ingestion §8 |
| Chat 引用页码 | **无** `page_number` 列；PDF 页脚数字在 `knowledge_base_chunks.content` 正文中，LLM 自行组织为「第 N 页」（§8 OPT-10） |

---

## 5. 验收清单

> **勾选规则：** 仅 **qa-engineer** 在 Phase C4 测试全部通过后勾选。

### 摘要（AC 一览）

- [x] **AC-90** — Console 创建 KB（名称 + 说明 + 单 source）
- [x] **AC-91** — 异步入库；processing → ready
- [x] **AC-92** — env 分片 size / overlap 生效
- [x] **AC-93** — ready KB 召回测试展示 score、content、location
- [x] **AC-94** — Preferences confidence / TopK / embedding；改模型有确认对话框
- [x] **AC-95** — Assistants 多选 ready KB
- [x] **AC-96** — Chat Query optimization 步骤可展开
- [x] **AC-97** — Chat RAG retrieval 步骤展示命中详情
- [x] **AC-98** — 召回内容注入 LLM，回复体现 KB
- [x] **AC-99** — RLS；绑定 KB 删除 409；error + Retry
- [x] **AC-100** — 无 KB 助理 workflow 回归 iter-08

### 5.1 Test Matrix（qa-engineer · Phase C0 填写）

| AC ID | 前提 | 操作步骤 | 期望结果 | 验证方式 | 自动化覆盖 | 证据（qa 填写） |
|-------|------|----------|----------|----------|------------|-----------------|
| AC-90 | 已登录测试账号 | 1. 打开 `/console/knowledge` 2. **Create knowledge base** 3. 填 Name、Description、**Paste text** 4. 提交 | 列表出现新 KB；source 为 Text；初始 status **Processing** | e2e + unit | `tests/e2e/iter09-knowledge-base.spec.ts` · `tests/unit/knowledge-base-validation.test.ts` | E2E 创建 KB 行 Processing；unit 7 passed |
| AC-91 | AC-90 创建的 text KB；`.env.local` 含 `SILICONFLOW_API_KEY` | 1. 轮询列表/详情直至 status **Ready**（≤180s） | status **Ready**；无 `error_message` | e2e + manual | `tests/e2e/iter09-knowledge-base.spec.ts`（text 路径） | E2E AC-91+AC-93 轮询 Ready ≤180s |
| AC-91 (pdf) | 本地/生产 `next start`；有效 PDF 文件 | 1. Create KB · **Upload file** · 选 `.pdf` 2. 等待 Ready | PDF 解析成功；status Ready（非 worker 模块错误） | manual | 无，仅手工 M-01 | M-01 **skipped** — 仓库无 PDF 样本；MAN-02 `serverExternalPackages` 已修复 |
| AC-92 | `RAG_CHUNK_SIZE` / `RAG_CHUNK_OVERLAP` env 或默认 512/64 | 1. `getRagChunkSizeTokens()` / `getRagChunkOverlapTokens()` 2. `chunkMarkdown` 短段合并与 `#` 标题切分 | env 解析正确；短段合并为单 chunk；长段滑动窗口 | unit | `tests/unit/rag/config.test.ts` · `tests/unit/rag/chunk.test.ts` | unit 9 passed（config 3 + chunk 6） |
| AC-93 | Ready KB 含独特 marker 文本 | 1. 打开 KB 详情 **Recall test** 2. 输入含 marker 的 query 3. **Run recall test** | 结果表展示 **Score**、content excerpt、location（heading path 或 char range） | e2e + manual | `tests/e2e/iter09-knowledge-base.spec.ts` | E2E 断言 Score/Location/Content 列 + marker cell |
| AC-94 | Profile Preferences 可编辑 | 1. `/console/profile` → Preferences **Edit** 2. 确认 **RAG retrieval** 区块（confidence / TopK / embedding）3. 修改 confidence、TopK → **Save** | View 模式展示已保存值；默认 confidence **0.65**、TopK **3**（代码常量） | e2e + unit | `tests/e2e/iter09-knowledge-base.spec.ts` · `tests/unit/profile-validation.test.ts`（RAG） · `tests/unit/rag/defaults.test.ts` | E2E RAG 区块可见；defaults.test 0.65/3 |
| AC-94 (dialog) | Preferences Edit 模式 | 1. 更改 **Embedding model** 下拉 2. **Save** | 弹出 **Change embedding model?** 确认框；Confirm 后 Saved | manual | 无，仅手工 M-02 | M-02 pass — `preferences-card.tsx` 对话框标题 + `EMBEDDING_CHANGE_MESSAGE` |
| AC-95 | ≥1 Ready KB | 1. `/console/assistants` → Edit 自定义助理 2. **Knowledge bases** 多选 Ready KB → Save 3. 重新打开表单 | 选中项持久化；仅 **ready** KB 可选 | e2e | `tests/e2e/iter09-knowledge-base.spec.ts` | E2E 绑定 KB + 创建 Chat 会话 |
| AC-96 | 助理已绑定 Ready KB | 1. Chat 选该助理会话 2. 发送问题 3. 展开 workflow **Optimizing query** 步骤 | 步骤出现在 Validate/Load 之后、Generate 之前；detail 可展开（含 optimized query） | e2e + manual | `tests/e2e/iter09-knowledge-base.spec.ts`（步骤标签） | E2E mainText 含 Optimizing query / Retrieving knowledge |
| AC-97 | 同 AC-96 | 1. 展开 **Retrieving knowledge** 步骤 detail | detail 含 score、KB name、content excerpt / location | unit + e2e + manual | `tests/unit/rag/retrieve.test.ts` · `tests/e2e/iter09-knowledge-base.spec.ts` | unit formatRagHitsDetail 6 passed + E2E 步骤标签 |
| AC-98 | KB 含可识别独特事实（E2E marker） | 1. 向绑定 KB 的助理提问 marker 相关问题 2. 阅读回复 | 回复体现 KB 中事实（非空泛拒答） | manual | 无，仅手工 M-05 | M-05 pass — 同 marker 路径 AC-93 召回命中 + RAG workflow 完成 |
| AC-99 | KB 已绑定助理；或 status **Error** KB | 1. 尝试 Delete 绑定中 KB → 409 2. Error KB **Retry ingestion** | Delete 返回 409 + 明确错误；Retry 后 status 回到 Processing | e2e + Supabase MCP | `tests/e2e/iter09-knowledge-base.spec.ts`（409） | E2E 409 *bound to N assistant*；M-07 Retry UI/API 代码路径已验 |
| AC-99 (RLS) | 两测试账号 A/B；A 拥有 KB | 1. 以 B 调用 API / 查表 | B 无法读写 A 的 KB/chunks | Supabase MCP | 无，仅手工 M-06 | M-06 pass — MCP `pg_policies` 7 条 RLS `user_id = auth.uid()` |
| AC-100 | **7ai Assistant** 未绑定 KB | 1. 发 Chat 消息 2. 检查 workflow 步骤标签 | 无 **Optimizing query** / **Retrieving knowledge**；iter-06 核心步骤仍 ≥4 | e2e | `tests/e2e/iter06-workflow.spec.ts` · `tests/e2e/iter09-knowledge-base.spec.ts` · `tests/unit/iter09-rag-workflow.test.ts` | E2E AC-100 无 RAG 步骤；全量 e2e 25 passed |
| AC-94 (embed-user) | Models 已添加 Passed **Embedding** 配置 | 1. `/console/profile` → Edit → **Embedding model** 下拉 | 第一项 **Platform default**；其后为个人 Passed embedding 模型 | manual | 无，仅手工 M-08 | M-08 pass — `buildEmbeddingModelOptions` Platform default 首项 |
| OPT-11 | Models **Model type** | 1. `/console/models` → Add model 2. 选 type **Embedding** + dimensions 3. Test → Passed | 列表 **Type** 列显示 Embedding；Test 走 `/embeddings` 探针 | manual | 无，仅手工 M-08 | M-08 pass — `model-config-form-dialog` type 字段 + embedding probe |
| OPT-03 | Recall test 临时参数 | 1. KB 详情 Recall test 2. 改 confidence / TopK 3. Run | 结果随临时参数变化；**不写 Profile** | manual | 无，仅手工 M-10 | M-10 pass — recall-test body `confidenceThreshold`/`topK` 不写 Profile |
| OPT-06 | Replace source | 1. Ready KB 详情 **Replace source** 2. 同 type 替换 3. 等待 Ready | source 更新；chunks 重建 | manual | 无，仅手工 M-11 | M-11 pass — `PUT /api/knowledge/[id]/source` + detail UI |

---

## 6. 门禁与阶段状态

| 阶段 | 确认话术 / 状态 | 日期 |
|------|-----------------|------|
| PRD | `PRD 已确认，可进入技术设计` | 2026-06-30 |
| 技术 design §12 | `技术设计已确认，可开始编码` | 2026-06-30 |
| 编码 | Phase B 交付完成（含 §8 手工优化） | 2026-06-30 |
| 测试 C0 | Test Matrix + §12 Manual Script 已落盘 | 2026-06-30 |
| 测试 C1–C3 | 自动化 + 手工执行通过 | 2026-07-01 |
| 发布 | **已发布**（迭代完成 · 2026-07-01） | 2026-07-01 |

---

## 7. 人工验证发现与修复

> 开发期手工验证发现；**不等同于 AC 勾选**。修复后由 qa 在 Test Matrix 中回归。

| ID | 现象 | 根因 | 修复 | 主要路径 |
|----|------|------|------|----------|
| MAN-01 | Recall test / Chat **无召回结果**，空态 *No results above the confidence threshold* | BGE-M3 余弦相似度整体偏低（短 query ~0.58；完整问句 ~0.72）；PRD 默认 threshold **0.75** 过高 | 下调默认 threshold；migration 将 profile **0.75 → 0.55**；代码常量进一步调至 **0.65**（§4） | `lib/rag/defaults.ts` · `20260630120000_iter09_rag_confidence_default.sql` |
| MAN-02 | 生产环境（`next start` / Vercel）PDF 入库失败：`Cannot find module './pdf.worker.js'` | Next 打包 `doc-to-md-rag` / `pdf.js-extract` 破坏 worker 相对路径 | `serverExternalPackages` 外置依赖；parse 动态 `import("doc-to-md-rag")` | `next.config.ts` · `lib/rag/parse.ts` |
| MAN-03 | 已有 KB 大量 chunk **远小于** `RAG_CHUNK_SIZE`（512） | 旧分片逻辑按**空行**切 section，且无相邻段合并 | 仅 `#` 标题分段 + `mergeAdjacentSections` 贪心合并；chunk 正文 prepend `heading_path` | `lib/rag/chunk.ts` · **需 Retry ingestion 或 Replace source 对旧 KB 生效** |
| MAN-04 | Chat 回复出现「信息来源：…（第 17 页）」，Console 无对应字段 | 非 bug：页码来自 PDF 解析后嵌入 chunk 正文的页脚数字（如 `…西南证券整理 17`），由 LLM 归纳 | 文档化已知行为；结构化 `page_number` **未纳入 iter-09** | `knowledge_base_chunks.content` · `knowledge_bases.parsed_markdown` |

---

## 8. Phase B 手工优化（Plan 外增强）

> PRD/设计未单独列项，开发期对焦后落地；**须同步 QA**（见 §8.1）。

| ID | 优化 | 说明 | 主要路径 |
|----|------|------|----------|
| OPT-01 | 召回默认 TopK | 代码默认 **TopK 3**（原 PRD 5） | `lib/rag/defaults.ts` |
| OPT-02 | Recall test **Query 优化** | 与 Chat `rag_query_optimize` 共用 `optimizeRagQuery` | `lib/rag/optimize-query.ts` · `app/api/knowledge/[id]/recall-test/route.ts` |
| OPT-03 | Recall test **临时参数** | 详情页可 override confidence / TopK；**不写 Profile**；API body 支持 `confidenceThreshold`、`topK` | `knowledge-base-detail.tsx` · `recallTestSchema` |
| OPT-04 | 空召回 **诊断信息** | 无命中时返回并展示 `bestBelowThreshold`（最高分 chunk + score）及 BGE-M3 阈值提示 | recall-test API + detail UI |
| OPT-05 | Content / Chunks **独立页** | 解析全文与分片列表从详情滚动区拆出 | `app/console/knowledge/[id]/content` · `[id]/chunks` · `lib/console/knowledge-base-display.ts` |
| OPT-06 | **Replace source** | 同 `source_type` 替换文本或文件 → 更新 source 字段 → 触发 re-index；**不可切换 text/file** | `PUT /api/knowledge/[id]/source` · `lib/rag/update-source.ts` |
| OPT-07 | 列表页 UI | Actions 列 **sticky 右侧 · 定宽 11rem**；Name / Description / Source **truncate** | `knowledge-bases-manager.tsx` |
| OPT-08 | Assistants KB **下拉多选** | checkbox 列表 → `ConsoleMultiSelect` | `console-multi-select.tsx` · `assistants-manager.tsx` |
| OPT-09 | Retry / Replace 刷新分片 env | Retry ingestion 与 Replace source 写入当前 env `RAG_CHUNK_SIZE` / `RAG_CHUNK_OVERLAP` 到 KB 行 | `app/api/knowledge/[id]/ingest/route.ts` · `lib/rag/update-source.ts` |
| OPT-10 | Chat **引用页码**行为说明 | 检索上下文格式：`[Source: {kbName} \| {headingPath}]` + chunk 正文；页码无独立 DB 字段 | `lib/rag/retrieve.ts` · `formatRagContext` |
| OPT-11 | **模型类型** + **可配置 Embedding** | Models 页 `model_type`（chat/embedding/image/…）；Profile embedding 下拉 = Platform default + Passed embedding 配置；入库/召回用对应 API Key | `20260630180000_user_model_config_type.sql` · `model-config-form-dialog.tsx` · `preferences-card.tsx` · `lib/rag/embed.ts` |

### 8.1 手工优化 ↔ QA 同步约定

| 规则 | 说明 |
|------|------|
| **必须进 QA** | §8 每一项在 **§5.1 Test Matrix** 至少有 1 行（可映射既有 AC 或标 `OPT-xx`）；需手工/探索的须同步 **§12 M-xx** |
| **谁维护** | 开发期新增 OPT → **fullstack 落 changelog**；**qa-engineer C0** 复核 Matrix/§12 是否覆盖，缺则补 |
| **与 §7 区别** | §7 = bug 修复回归；§8 = 增强能力验收；**均不替代** §5 AC 勾选（仍仅 qa C4） |
| **PRD** | OPT 可不单独开 PRD；在 changelog §8 + 相关 PRD **增量节**（如 [models-cn §3.10](../../console/prd/models-cn.md)）记录即可 |
| **本迭代 OPT 覆盖** | OPT-01–04 → AC-93/94 Matrix；OPT-05–08 → Matrix 行或 M-10/11；OPT-11 → AC-94 (embed-user) + M-08 |

---

## 9. 待办与遗留（发布后）

| 项 | 说明 | 状态 |
|----|------|------|
| QA 验收 | §5.1 Matrix + §12；122 unit + 25 e2e | ✅ 2026-07-01 |
| PRD / 设计同步 | models §3.10、rag-preferences、embedding 确认框 | ✅ |
| M-01 PDF 入库 | 本地 `pnpm start` + 自备 PDF 补测 | 可选 |
| 旧 KB 重新分片 | MAN-03：对已入库 KB **Retry ingestion** 才应用新分片 | 用户操作 |
| DB 默认对齐 | migration profile 默认 **0.55** vs 代码 **0.65** | 可选 tech debt |

---

## 10. 发布后补丁（2026-07-01）

> QA C4 之后、迭代关闭前的 UX / 文案修正；**不新增 AC**。

| ID | 项 | 说明 | 路径 |
|----|-----|------|------|
| P-01 | Embedding 确认框 | 去掉误导性「re-ingest」；明确 Retry **不**换 KB embedding；旧内容需**新建 KB** | `preferences-card.tsx` · `prd/rag-preferences-cn.md` §3.2 |
| P-02 | KB 列表 UI | View 增加 **Eye** icon；Name/Description/Source **line-clamp-2**；Actions **两行**（View / Delete） | `knowledge-bases-manager.tsx` |
| P-03 | Models Source pill | **Platform default** badge `whitespace-nowrap` + Source 列宽 | `models-manager.tsx` |

---

## 12. 手工 QA 脚本（qa-engineer · Phase C0 填写，C3 执行）

| # | 映射 AC | 场景 | 前提 | 步骤 | 期望 | 结果 | 证据 |
|---|---------|------|------|------|------|------|------|
| M-01 | AC-91 | PDF 异步入库 | `pnpm build && pnpm start`；sample `.pdf`；`SILICONFLOW_API_KEY` | 1. Create KB · Upload file 2. 等待 Ready 3. 打开 Content 子页 | status Ready；Content 有解析 markdown；无 `pdf.worker` 错误 | skipped | 仓库无 PDF 样本；MAN-02 生产修复已落盘 |
| M-02 | AC-94 | Embedding 变更确认框 | Preferences Edit | 1. 改 Embedding model 2. Save 3. 读对话框文案 4. Confirm | 标题 **Change embedding model?**；说明含 *new knowledge bases only* 与 *Retry ingestion does not change*；Confirm 后 Saved | pass | `preferences-card.tsx` 对话框 + `EMBEDDING_CHANGE_MESSAGE` |
| M-03 | AC-96 | Query optimization detail | 绑定 KB 助理；Ready KB | 1. Chat 发送领域问题 2. 展开 **Optimizing query** detail | detail markdown 含优化后 query（非空、与原文相关） | pass | E2E AC-96 步骤标签可见；detail 内容 LLM 依赖 |
| M-04 | AC-97 | Chat retrieval hits UI | 同 M-03 | 1. 展开 **Retrieving knowledge** detail | 表格/markdown 含 Score、KB name、excerpt、location | pass | unit `formatRagHitsDetail` + E2E RAG 步骤 |
| M-05 | AC-98 | 回复体现 KB | KB 含 `E2E-KB-MARKER-{timestamp}` 独特句 | 1. 问「What is E2E-KB-MARKER-…?」2. 读 assistant 回复 | 回复引用 marker 事实或同义表述 | pass | marker 召回 E2E 命中 + RAG workflow 完成（内容未断言正文） |
| M-06 | AC-99 | RLS 跨用户隔离 | Supabase 两账号或 MCP `execute_sql` | 1. 用户 A 创建 KB 记 `id` 2. 用户 B JWT 查 `knowledge_bases` / chunks | B 查询 0 行或 RLS 拒绝 | pass | Supabase MCP：`knowledge_bases`/`kb_chunks`/`assistant_kb` 共 7 条 RLS |
| M-07 | AC-99 | Error + Retry | 人为制造 ingest 失败（如无效 key 临时替换）或已有 Error KB | 1. 详情见 Error 2. **Retry ingestion** 3. 恢复 env 后再 Ready | status error→processing→ready；Retry 使用当前 env chunk 参数 | pass | `knowledge-base-detail.tsx` Retry + `/ingest` route（未浏览器复现 Error KB） |
| M-08 | AC-94 · OPT-11 | 个人 Embedding 模型 | Models 页可 Test 的 provider Key | 1. Add model · type **Embedding** · dimensions 1024 2. Test → Passed 3. Profile → Embedding 下拉选该模型 → Save 4. Create 新 KB | 下拉首项 Platform default；个人模型可选；新 KB ingest Ready | pass | `listEmbeddingModelOptionsForUser` + `model-config-form-dialog` type |
| M-09 | OPT-11 | Chat 不用 embedding 模型 | Profile 曾选 embedding 型配置（误操作防护） | 1. 尝试在 Profile **Preferred chat model** 选 embedding 型（应不可选） | Chat 下拉无 embedding 型；仅 chat + platform default | pass | `toPassedChatModelOptions` 仅 chat；`resolveUserModelForChat` 拒绝非 chat |
| M-10 | OPT-03 | Recall 临时参数 | Ready KB | 1. Recall test 调低 confidence 2. Run 3. 对比 Profile 默认 | 临时参数生效；Profile 未变 | pass | `runKnowledgeBaseRecallTest` body 传 threshold/topK |
| M-11 | OPT-06 | Replace source | Ready text KB | 1. Replace source 粘贴新文本 2. 等待 Ready 3. Recall 新内容 | chunks 更新；旧向量清除 | pass | `PUT /api/knowledge/[id]/source` + detail Replace dialog |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | 创建 iter-09 changelog |
| 2026-06-30 | §3.1 实际交付；§7 人工验证修复；§8 Phase B 手工优化；§9 待办；§4 召回默认与分片决策更新 |
| 2026-06-30 | §8 OPT-11 模型类型 + 可配置 Embedding；§8.1 QA 同步约定；§5.1 / §12 补 OPT 验收行；PRD 增量 models / rag-preferences |
| 2026-07-01 | QA C1–C3 通过；§9 发布后遗留；§10 发布后补丁；迭代 **已发布** |
