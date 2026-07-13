# todoList — 待完成功能 backlog

> **English:** [README.md](./README.md)

跨迭代待办：记录**当前迭代不做**、但后续可能要做的能力。不替代 `docs/iterations/iter-NN/`（时间盒目标）或 feature PRD。

## 文件

| 文件 | 用途 |
|------|------|
| [backlog-cn.md](./backlog-cn.md) | 待办条目（中文主维护） |
| [backlog.md](./backlog.md) | 待办条目（英文对等） |

## 何时新增条目

- 迭代中砍掉或推迟的范围（例：iter-12 移除 Admin 代发重置邮件 → 记入用户自助找回密码）
- 已对焦但**未排进本 iter** 的产品想法
- 不应阻塞发布的跟进项 / 技术债

交付后移至 **已完成**（注明 iter 与链接）。

## 新开启迭代时（强制）

**product-analyst**（或负责规划迭代的 Agent）须：

1. 阅读 [backlog-cn.md](./backlog-cn.md)
2. 列出与下一 iter **可能相关**的未完成条目
3. **请用户确认**：哪些 backlog 纳入新迭代范围、哪些继续搁置
4. 纳入项 → 写入 PRD / `iterations/iter-NN/README*` 范围；未纳入项留在 backlog

**禁止**未经用户确认，把 backlog 默认并入新迭代。

## 条目 ID

`{领域}-{序号}` — 如 `AUTH-01`、`ADMIN-02`
