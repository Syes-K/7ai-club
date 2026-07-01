# 知识库 RAG — 产品需求总纲

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `knowledge-base`  
> **迭代：** **`iter-09`** — 见 [iter-09 README](../../iterations/iter-09/README-cn.md)  
> **路线图阶段：** 2 — 知识库  
> **状态：** **PRD 已确认**  
> **PRD 确认日期：** 2026-06-30  
> **文档版本：** v0.1

---

## 1. 执行摘要

为已登录用户提供 **知识库（Knowledge Base）** 全链路能力：在 Console 创建/管理 KB（单 source：粘贴文本或上传 md/txt/pdf/docx）→ 异步入库（解析、混合分片、向量化至 Supabase pgvector）→ 召回测试；在 Preferences 配置召回参数；在 Assistants 挂载多个 KB；Chat 中挂载 KB 的助理在 Workflow 中展示 **Query optimization** 与 **RAG retrieval** 节点，并将召回内容注入 LLM 上下文。**用户可见 UI 文案为 English。**

---

## 2. 全局约定

### 2.1 路由

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/console/knowledge` | 知识库列表 | 需登录 |
| `/console/knowledge/new` | 新建 KB（技术设计可合并为 dialog） | 需登录 |
| `/console/knowledge/[id]` | KB 详情 / 编辑 / 召回测试 | 需登录 |

`/console/knowledge` 自 iter-03 占位页升级为完整管理页。

### 2.2 数据与隔离

| 项 | 约定 |
|----|------|
| 向量库 | Supabase **pgvector** |
| 租户 | 每用户独立 KB；RLS `user_id = auth.uid()` |
| KB ↔ source | **1 KB = 1 source**（文本 **或** 文件，不可混用） |
| Embedding 模型 | **KB 创建时锁定**；Preferences 改模型须警告旧 KB 可能需 re-embed |
| 分片 | **混合方案**：Markdown 结构边界 + 固定 token 窗口；overlap 与 chunk size 由 **环境变量** 配置 |

### 2.3 入库执行

| 项 | 约定 |
|----|------|
| 触发 | 创建/上传后立即触发 **异步 job**（不在 chat route） |
| 解析 | pdf/docx → [`doc-to-md-rag`](https://www.npmjs.com/package/doc-to-md-rag)；md/txt 直接使用 |
| 状态 | `processing` → `ready` \| `error`；error 可 **Retry** |

### 2.4 权限

| 操作 | 谁可以 |
|------|--------|
| CRUD 自己的 KB | 本人 |
| 删除被助理绑定的 KB | **禁止**（HTTP 409，类似 Assistants） |
| 召回测试 | KB 所有者；KB 状态 `ready` |
| 查看 Chat RAG 步骤 | 对话所有者 |

### 2.5 非目标（iter-09）

- MCP / Skills 节点  
- 每 KB 多 source、文本与文件混用  
- KB 版本历史 / diff  
- 组织级共享 KB  
- 全库批量 re-embed  
- 可视化 Workflow 编辑器  

### 2.6 非功能（摘要）

| 类型 | 要求 |
|------|------|
| 性能 | 召回测试 & Chat RAG 检索 < 3s（正常网络，单用户 KB 规模 MVP） |
| 安全 | RLS；Storage 文件仅 owner 可读；摘要不泄露 API Key |
| 部署 | 入库 job 与 chat route 分离；`runtime = 'nodejs'` |
| 语言 | 用户可见 UI **English** |

### 2.7 功能索引

| ID | 功能 | 详细 PRD | 迭代 |
|----|------|----------|------|
| F-90 | Console 知识库管理 | [prd/kb-management-cn.md](./prd/kb-management-cn.md) | iter-09 |
| F-91 | 异步入库（解析/分片/向量化） | [prd/kb-ingestion-cn.md](./prd/kb-ingestion-cn.md) | iter-09 |
| F-92 | 召回测试 | [prd/kb-recall-test-cn.md](./prd/kb-recall-test-cn.md) | iter-09 |
| F-93 | Preferences RAG 配置 | [prd/rag-preferences-cn.md](./prd/rag-preferences-cn.md) | iter-09 |
| F-94 | Assistants 多 KB 绑定 | [prd/assistant-kb-binding-cn.md](./prd/assistant-kb-binding-cn.md) | iter-09 |
| F-95 | Chat RAG Workflow 节点 | [prd/chat-rag-nodes-cn.md](./prd/chat-rag-nodes-cn.md) | iter-09 |

---

## 3. 文档地图

### 3.1 产品（`prd/`）

| 文档 | 范围 |
|------|------|
| [prd/kb-management-cn.md](./prd/kb-management-cn.md) | 列表、CRUD、单 source、状态 |
| [prd/kb-ingestion-cn.md](./prd/kb-ingestion-cn.md) | doc-to-md-rag、混合分片、embedding、pgvector |
| [prd/kb-recall-test-cn.md](./prd/kb-recall-test-cn.md) | Console 内召回测试 UI |
| [prd/rag-preferences-cn.md](./prd/rag-preferences-cn.md) | Profile Preferences 召回参数 |
| [prd/assistant-kb-binding-cn.md](./prd/assistant-kb-binding-cn.md) | 助理多选 KB |
| [prd/chat-rag-nodes-cn.md](./prd/chat-rag-nodes-cn.md) | Query optimize + RAG retrieve 节点 |

### 3.2 迭代变更（`changelog/`）

| 文档 | 范围 |
|------|------|
| [changelog/iter-09-cn.md](./changelog/iter-09-cn.md) | iter-09 必读 + AC-90–100 |

---

## 4. 验收标准（索引）

- [ ] **AC-90** — Console 创建 KB（名称 + 说明 + 单 source）  
- [ ] **AC-91** — 上传后异步入库；状态 processing → ready  
- [ ] **AC-92** — 分片 size / overlap 由 env 配置生效  
- [ ] **AC-93** — ready KB 可召回测试  
- [ ] **AC-94** — Preferences 配置 confidence / TopK / embedding 模型  
- [ ] **AC-95** — Assistants 多 KB 绑定  
- [ ] **AC-96** — Chat Query optimization 节点可展开  
- [ ] **AC-97** — Chat RAG retrieval 节点展示命中详情  
- [ ] **AC-98** — 召回内容注入 LLM，回复体现 KB  
- [ ] **AC-99** — RLS；绑定中 KB 不可删（409）  
- [ ] **AC-100** — 无 KB 助理 workflow 回归不变  

详见 [changelog/iter-09-cn.md](./changelog/iter-09-cn.md) §5。

---

## 5. 产品决策记录（iter-09 已确认）

| 项 | 决策 |
|----|------|
| 文档解析 | PDF/DOCX → npm [`doc-to-md-rag`](https://www.npmjs.com/package/doc-to-md-rag) v1.x |
| 分片 | 结构边界（A）+ 固定 token 窗口与 env overlap（B） |
| 入库 | 异步 job；上传 API 立即返回 processing |
| Embedding | KB 创建时锁定模型；改 Preferences 模型时弹警告 |
| Embedding 默认 | **SiliconFlow · BAAI/bge-m3 · 1024 维**（env 可覆盖） |
| Source | 1 KB = 1 source；文本与文件不可混用 |
| 删除 | 被助理绑定 → 409；ingest 失败 → error + Retry |

---

## 6. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-30 | v0.1 | iter-09 初稿 — 用户确认 PRD |
| 2026-06-30 | v0.2 | 技术设计：默认 SiliconFlow BAAI/bge-m3 1024 维 |

---

*下一文档：`02-technical-design-cn.md`（由 fullstack-developer 产出）*
