# iter-10 — 发布后 UX 与 RAG 调优

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-10`  
> **状态：** **已发布**  
> **路线图阶段：** 2 — 知识库（增量 polish）+ 1 — MVP 壳层 UX  
> **计划发布：** 2026-07-03  
> **实际发布：** 2026-07-03  
> **Git tag（可选）：** `iter-10`  
> **前置：** [iter-09](../iter-09/README-cn.md) **已发布**

---

## 1. 迭代目标

- [x] 整理 iter-09 发布后的 Landing / Header / Auth / Chat 壳层 UX 优化
- [x] RAG Query optimization 改为 **Preferences 可配置**（默认关）；Recall test 复用弹窗
- [x] Console 列表 Actions 列 sticky + 紧凑按钮；Recall 空结果按 KB 实际 embedding 提示
- [x] QA C0–C4 验收通过并发布

---

## 2. 范围

### In Scope

| 区域 | 变更摘要 |
|------|----------|
| **Landing** | Header 全宽；Hero + 能力区一体垂直布局；Footer 贴底；6 项能力卡片（12px）；去掉顶栏 Chat / Register |
| **Auth** | 登录页 Sign up 切换保留 `?next=`；顶栏仅 Sign in（带 icon） |
| **Chat** | 助手选择弹窗 **Manage assistants**；空列表 deep link `?create=1` |
| **RAG** | Profile **Query optimization** 开关（默认 false）；Chat 按偏好跳过/插入 optimize 节点；Recall test 独立 dialog + 覆盖开关 |
| **Console UI** | Models / KB / Assistants 表格 Actions 右侧 sticky；Recall hint 动态 embedding 文案 |
| **DB** | `user_profiles.rag_query_optimize_enabled` migration |
| **测试** | 单元 127 + E2E iter10-polish / iter09 回归 |

### Out of Scope

- 新 RAG 算法或 embedding 模型
- Landing 多语言
- Console 内嵌创建 Assistant 表单（仍跳转 Console）
- KB 批量 re-embed

---

## 3. 包含的 Features

| Slug | Changelog | 状态 |
|------|-----------|------|
| `mvp-chat` | [changelog/iter-10-cn.md](../../features/mvp-chat/changelog/iter-10-cn.md) | **已发布** |
| `knowledge-base` | [changelog/iter-10-cn.md](../../features/knowledge-base/changelog/iter-10-cn.md) | **已发布** |
| `console` | [changelog/iter-10-cn.md](../../features/console/changelog/iter-10-cn.md) | **已发布** |

---

## 4. 验收

### 4.1 自动化

- [x] `pnpm lint` — 2026-07-03
- [x] `pnpm build` — 2026-07-03
- [x] `pnpm test` — 127 passed
- [x] `pnpm test:e2e` — `CI=1`；iter10 + iter09 回归通过（E2E 选择器修复后）
- [x] iter-06–09 回归（iter04 1 flaky afterEach，非 iter-10 阻塞项）

### 4.2 手工 QA

- [x] AC-101–110 — 各 feature changelog §5 / §12

### 4.3 发布

- [x] 各 changelog §5 AC 已全部勾选（qa-engineer · 2026-07-03）
- [x] 用户确认：`测试已通过，可发布`（2026-07-03）

---

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | iter-09 已发布；migration `rag_query_optimize_enabled` 已 apply |
| 已缓解 | Query optimization 默认关 — iter-09 M-03 需 Pref 开启后复测 |
| 遗留 | iter04 afterEach 清理偶发超时（flaky，非本迭代引入） |

---

## 6. 门禁记录

| 日期 | 事件 |
|------|------|
| 2026-07-02 | 整理 iter-09 后未提交变更，立项 iter-10 |
| 2026-07-02 | Phase B 编码交付 |
| 2026-07-02 | 迭代文档 + Test Matrix + E2E 用例落盘 |
| 2026-07-03 | lint 修复（recall dialog setState-in-effect） |
| 2026-07-03 | E2E 选择器修复（header Chat exact、Recall placeholder） |
| 2026-07-03 | qa C0–C4：AC-101–110 全部勾选；127 unit + e2e 通过 |
| 2026-07-03 | **迭代已发布** |

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-02 | 创建 iter-10；汇总 post-iter-09 变更 |
| 2026-07-03 | QA 验收通过；标 **已发布** |
