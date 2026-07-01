# 知识库管理（Console）

> **English:** [kb-management.md](./kb-management.md)  
> **中文：** [kb-management-cn.md](./kb-management-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-09

---

## 1. 范围

F-90 — `/console/knowledge`：每用户拥有多个知识库；支持新增、编辑、删除（带保护）。替换 iter-03 占位页。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-90 | 作为用户，我希望在 Console 查看知识库列表，以便管理我的资料 | P0 |
| US-91 | 作为用户，我希望创建知识库并输入名称、说明和内容，以便快速建立文本知识库 | P0 |
| US-92 | 作为用户，我希望上传 md/txt/pdf/docx 文件作为知识库来源，以便复用已有文档 | P0 |
| US-93 | 作为用户，我希望看到入库进度与错误状态，以便知道何时可用或重试 | P0 |

---

## 3. F-90 Knowledge Base 管理

### 3.1 列表

- 表格：**Name**、**Description**（截断）、**Source type**（`Text` / `File`）、**Status**（`Processing` / `Ready` / `Error`）、最后更新时间、Actions
- 空态：引导创建第一个知识库 + **Create knowledge base** 按钮
- `Processing` 行显示行内 spinner 或 muted 文案 *Processing…*；列表可轮询或手动刷新（技术设计定）

### 3.2 新建

**Source 类型（二选一，创建后不可切换）：**

| 模式 | 输入 | 说明 |
|------|------|------|
| **Text** | 多行文本框 | 用户粘贴 Markdown 或纯文本；最长限制由技术设计定（建议 ≤ 512KB 字符） |
| **File** | 文件选择 | 接受 `.md`、`.txt`、`.pdf`、`.docx`；单文件；大小上限由技术设计定（建议 10MB） |

**共用字段：**

| 字段 | 必填 | 说明 |
|------|------|------|
| Name | 是 | UI English；最长 64 字符 |
| Description | 否 | 最长 500 字符 |

**创建后：**

- 立即返回；KB 状态 `processing`
- 触发异步入库（见 [kb-ingestion-cn.md](./kb-ingestion-cn.md)）
- **Embedding 模型** 取用户当前 Preferences 中的 RAG embedding 配置（创建时锁定至该 KB）

### 3.3 详情 / 编辑

- **Name**、**Description** 可编辑并 Save
- **Source 内容不可替换**（1 KB = 1 source）；要换内容须删除后新建
- `Ready` 状态：展示 source 摘要（文件名或文本前 N 字符）+ 链接至 [召回测试](./kb-recall-test-cn.md)
- `Error` 状态：展示错误摘要（English）+ **Retry ingestion** 按钮
- `Processing` 状态：禁用召回测试；可查看基本信息

### 3.4 删除

- 确认对话框
- 若存在 `assistant_knowledge_bases` 引用 → **禁止删除**（HTTP 409）
- 错误文案（English）：如 *"This knowledge base is bound to N assistant(s). Unbind it first."*
- 成功删除：移除 KB 行、Storage 文件（若有）、向量 chunks

### 3.5 权限

- 用户仅可见/操作 `user_id = auth.uid()` 的行

### 3.6 Loading UX

- 列表首屏：`ConsolePageLoading` / `loading.tsx`（见 [loading-ux-cn.md](../../../loading-ux-cn.md)）
- 创建 / 删除 / Save：页面级 busy（`usePageBusy`）

---

## 4. 验收标准

- [ ] **AC-90** — 可创建 KB（Name + Description + Text 或 File 单 source）
- [ ] **AC-91** — 创建后状态为 Processing，完成后 Ready
- [ ] **AC-99** — 被助理绑定时删除返回 409；ingest 失败为 Error 且可 Retry

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | iter-09 初稿 |
