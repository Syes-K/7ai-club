# iter-NN 变更摘要 — [主题]

> **English:** [iter-NN.md](./iter-NN.md)  
> **中文：** [iter-NN-cn.md](./iter-NN-cn.md)  
> **迭代索引：** [iter-NN/README-cn.md](../../iterations/iter-NN/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| [子能力] | [prd/xxx-cn.md](../prd/xxx-cn.md) | [design/xxx-cn.md](../design/xxx-cn.md) |

---

## 2. 必读

1. [01-product-requirements-cn.md](../01-product-requirements-cn.md)
2. [prd/xxx-cn.md](../prd/xxx-cn.md)
3. [design/xxx-cn.md](../design/xxx-cn.md)
4. **若本迭代有交叉 feature：** 各交叉 [changelog/iter-NN-cn.md](../../<affected>/changelog/iter-NN-cn.md)（见 iter README）

> 主 changelog 用本模板；交叉 feature 用 [changelog-cross-iter-template-cn.md](./changelog-cross-iter-template-cn.md)

---

## 3. 计划交付（编码前）

| 区域 | 路径 / 说明 |
|------|-------------|
| | |

---

## 4. 产品决策记录（iter-NN 已确认）

| 项 | 决策 |
|----|------|
| | |

---

## 5. 验收清单

> **勾选规则：** 仅 **qa-engineer** 在 Phase C4 测试全部通过后勾选。  
> **PRD § 验收标准** 保持定义态（`[ ]`），不在编码/用户确认阶段勾选；发布时可由 qa 同步或保持 PRD 为索引。  
> **详细步骤与证据** 写在 §5.1 Test Matrix；手工脚本见 §12。

### 摘要（AC 一览）

- [ ] **AC-XX** — [一行摘要，What]

### 5.1 Test Matrix（qa-engineer · Phase C0 填写）

> 从 PRD AC + design §12 展开。C0 落盘后再进入 C1–C3 执行。

| AC ID | 前提 | 操作步骤 | 期望结果 | 验证方式 | 自动化覆盖 | 证据（qa 填写） |
|-------|------|----------|----------|----------|------------|-----------------|
| AC-XX | 测试账号、Preferences 默认值等 | 1. … 2. … | 可观察、可判定 pass/fail | unit / e2e / manual / Supabase MCP | `tests/unit/...` 或「无，仅手工」 | 命令输出 / 截图 / SQL 摘要 |

**验证方式枚举：** `unit` · `e2e` · `manual` · `static` · `Supabase MCP` · `组合`

---

## 6. 门禁与阶段状态

| 阶段 | 确认话术 / 状态 | 日期 |
|------|-----------------|------|
| PRD | `PRD 已确认，可进入技术设计` | |
| 技术 design §12 | 技术设计已确认（含验收映射初稿） | |
| 编码 | Phase B 交付完成 | |
| 测试 C0 | Test Matrix + §12 Manual Script 已落盘 | |
| 测试 C1–C3 | 自动化 + 手工执行通过 | |
| 发布 | **已发布**（用户：`测试已通过，可发布`） | |

---

## 7. 人工验证发现与修复（可选）

> 开发期发现；**不等同于 AC 勾选**。修复后由 qa 在 Test Matrix 中回归。

| ID | 现象 | 修复 |
|----|------|------|
| H-01 | | |

---

## 8–11. [优化、指标、已知限制等 — 按需]

---

## 12. 手工 QA 脚本（qa-engineer · Phase C0 填写，C3 执行）

> 与 §5.1 对齐；每条须可逐步执行。C3 完成后填写「结果」与「证据」。

| # | 映射 AC | 场景 | 前提 | 步骤 | 期望 | 结果 | 证据 |
|---|---------|------|------|------|------|------|------|
| M-01 | AC-XX | [简短标题] | | 1. … | | pass / fail | |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| | 创建 iter-NN changelog |
