# admin — 功能概览

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Feature slug:** `admin`  
> **迭代:** [iter-12](../../iterations/iter-12/README-cn.md)（进行中）

---

## 文档地图（Agent 入口）

**iter-12（当前）：**

1. [changelog/iter-12-cn.md](./changelog/iter-12-cn.md) — AC-120–141（主验收）
2. [iter-12/README-cn.md](../../iterations/iter-12/README-cn.md)

**交叉 changelog（同迭代）：**

- [console/changelog/iter-12-cn.md](../console/changelog/iter-12-cn.md) — Console 回归
- [mvp-chat/changelog/iter-12-cn.md](../mvp-chat/changelog/iter-12-cn.md) — Chat 模型 / 对话

**必读顺序：**

1. [01-product-requirements-cn.md](./01-product-requirements-cn.md) — 总纲
2. [02-technical-design-cn.md](./02-technical-design-cn.md) — 技术总纲 + §12 AC 映射
3. [changelog/iter-12-cn.md](./changelog/iter-12-cn.md) — 本迭代增量
4. 按需加载 `design/*`、`prd/*`

---

## iter-12 范围摘要

- **`/admin`** — 平台后台；`ADMIN_EMAILS` 邮箱白名单鉴权
- **Users** — 全站用户列表；禁用账号、重置密码
- **Platform Models** — 7ai 免费模型 CRUD；替代 env `BAILIAN_API_KEY` 虚拟默认行
- **Platform Assistants** — 系统助理 CRUD；New Chat **聚合列表**（系统排后）
- **Chat / Profile 集成** — 用户可选平台模型与系统助理

---

*分层说明:* [docs/README-cn.md](../../README-cn.md)
