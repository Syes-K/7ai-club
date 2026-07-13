# [Iteration title, e.g. iter-01 — MVP Chat]

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-01`  
> **状态：** 计划中 / 进行中 / 已发布  
> **路线图阶段：** 1（见 architecture reference 实施路线图）  
> **计划发布：** YYYY-MM-DD  
> **实际发布：** YYYY-MM-DD / —  
> **Git tag（可选）：** `v0.1.0`

---

## 1. 迭代目标

[本时间盒内要达成的 1–3 个可衡量目标]

## 2. 范围

### In Scope

- [交付项 1]
- [交付项 2]

### Out of Scope（本迭代不做）

- [明确排除项]

## 3. 包含的 Features

| Feature slug | PRD | 技术设计 | 优先级 | 本迭代状态 |
|--------------|-----|----------|--------|------------|
| `mvp-chat` | [01-product-requirements.md](../features/mvp-chat/01-product-requirements.md) · [01-product-requirements-cn.md](../features/mvp-chat/01-product-requirements-cn.md) | [02-technical-design.md](../features/mvp-chat/02-technical-design.md) · [02-technical-design-cn.md](../features/mvp-chat/02-technical-design-cn.md) | P0 | In progress |

路径约定：文档在 `docs/features/<slug>/`，**不在**迭代文件夹内重复存放 PRD/设计。

### 交叉 Changelog（同迭代，若有）

> 跨 feature 迭代时填写。主 AC 在主 feature changelog §5 勾选；交叉 changelog 写回归项与 §5.1。模板：`changelog-cross-iter-template-cn.md`

| Feature | Changelog | 角色 |
|---------|-----------|------|
| `<primary>` | [changelog/iter-NN-cn.md](../features/<primary>/changelog/iter-NN-cn.md) | 主验收 |
| `<affected>` | [changelog/iter-NN-cn.md](../features/<affected>/changelog/iter-NN-cn.md) | 交叉回归 |

## 4. 迭代验收标准

> **AC 签字：** 仅 **qa-engineer** 勾选 feature `changelog/iter-NN-cn.md` §5。PRD § 验收标准保持 `[ ]` 定义态。

### 4.1 自动化（qa Phase C2）

- [ ] `pnpm lint` 通过
- [ ] `pnpm build` 通过
- [ ] `pnpm test` 通过
- [ ] `pnpm test:e2e` 通过（建议 `CI=1`；或说明跳过原因）

### 4.2 用例与手工 QA（qa Phase C0 + C3）

- [ ] 主 feature changelog **§5.1 Test Matrix** 已填写（C0）
- [ ] 交叉 feature changelog **§5.1** 已填写或合并入主 changelog（C0）
- [ ] changelog **§12 Manual Script** 已执行并填证据（C3）
- [ ] 见各 feature changelog §5 / §12

### 4.3 发布

- [ ] changelog §5 AC 已全部勾选（**qa-engineer** C4）
- [ ] 用户确认：`测试已通过，可发布`

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | [其他迭代 / 外部服务] |
| 风险 | [及缓解] |

## 6. 发布记录

| 日期 | 事件 | 备注 |
|------|------|------|
| | 迭代启动 | |
| | 已发布 | |

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| | 创建 iter-01 |
