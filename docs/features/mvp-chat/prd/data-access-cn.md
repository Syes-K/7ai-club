# 混合数据访问 — 产品（iter-04）

> **English:** [data-access.md](./data-access.md)  
> **中文：** [data-access-cn.md](./data-access-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-04  
> **状态：** 已交付（2026-06-17）

---

## 1. 范围

F-30 — 重构数据访问：CRUD 走浏览器 Supabase；仅 chat/LLM 走 Node。**无用户可见功能变更**；行为一致、切换更快、架构更清晰。

---

## 2. 用户可感知影响

| 区域 | 之前 | 之后 |
|------|------|------|
| 切换对话 | BFF `/session` + loading | 直连 Supabase；同等或更快 |
| Console CRUD | BFF `/api/profile`、`/api/assistants` | 直连 Supabase |
| 发消息 | `/api/chat` | 不变 |

---

## 3. 非目标

- 新页面或 UI 文案变更
- OAuth、组织模型
- 离线支持

---

## 4. 验收标准

- [x] **AC-30** — 切换对话不再调用废弃的 BFF session 路由
- [x] **AC-31** — Profile 保存经浏览器 data 层可用
- [x] **AC-32** — Assistants CRUD 经浏览器 data 层可用
- [x] **AC-33** — 创建对话仍能在配置时插入开场白
- [x] **AC-34** — `/api/chat` 仍为唯一使用 LLM env 的路由

验证方式见 [changelog/iter-04-cn.md](../changelog/iter-04-cn.md) §6。

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | iter-04 初稿 |
| 2026-06-17 | 实现完成；AC 勾选 |
