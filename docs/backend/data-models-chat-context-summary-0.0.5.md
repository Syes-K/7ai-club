# 数据模型：会话上下文摘要（version=0.0.5）

## 1. SQLite `chat_sessions` 扩展列

| 列名 | 类型 | 说明 |
|------|------|------|
| `context_summary` | `TEXT`（可空） | 当前会话的滚动摘要正文；清空会话消息时置 `NULL` |
| `summary_message_count_at_refresh` | `INTEGER`，默认 `0` | **上次**摘要尝试或成功时对应的持久化消息条数 `n`；用于触发间隔与失败退避 |

迁移：`src/lib/chat/store/sqlite-store.ts` 中 `migrate()`，对已有库 `ALTER TABLE ... ADD COLUMN`（幂等检测 `PRAGMA table_info`）。

---

## 2. 应用配置 `AppConfig`（JSON 文件）

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `contextSummaryEnabled` | `false` | 是否启用摘要 |
| `contextSummaryMaxChars` | `4000` | 摘要写入模型前最大字符数 |
| `contextSummaryRefreshEvery` | `8` | 自上次将 `summary_message_count_at_refresh` 更新为某 `n` 后，至少再增加多少条持久化消息才再次尝试摘要 |

定义：`src/lib/config/defaults.ts`；合并：`merge.ts`；保存校验：`validate-save.ts`。

---

## 3. 摘要语义（与 PRD §2.1.1 一致）

- 采用 **整段重写**：每次刷新时，输入为**当前窗口外全部消息**（第 `1…(n−K)` 条）拼接文本，经独立摘要调用写入 `context_summary`，并将 `summary_message_count_at_refresh = n`。
