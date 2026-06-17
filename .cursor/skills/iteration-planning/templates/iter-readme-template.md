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

## 4. 迭代验收标准

### 4.1 自动化

- [ ] `pnpm lint` 通过
- [ ] `pnpm build` 通过
- [ ] `pnpm test` 通过
- [ ] `pnpm test:e2e` 通过（或说明跳过原因）

### 4.2 手工 QA

- [ ] [见 feature changelog § 手工 QA]

### 4.3 发布

- [ ] changelog AC 已全部勾选（由 `qa-engineer` 完成）
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
