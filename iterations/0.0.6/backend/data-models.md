# 数据模型：管理端日志查看（version=0.0.6）

## 1. 持久化日志行（已有，0.0.1）

每行一个 JSON 对象，最小公共字段（实际可能更多）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `ts` | string | ISO 8601，写入时刻；**查询时间窗以此为准** |
| `level` | string | `info` \| `warn` \| `error` 等 |
| `event` | string | 事件名，如 `api.request_received` |
| `requestId` | string | 可选，请求关联 ID |

其余字段随事件变化（如 `messages`、`provider`、`model` 等）。

## 2. 文件组织（已有）

- 目录：`<cwd>/.logs/`
- 文件名：`YYYY-MM-DD-HH.log`（**服务器本地时区**的整点小时，与 `src/lib/chat/logger.ts` 一致）

## 3. 查询抽象（本迭代）

TypeScript 模块：`src/lib/logs/chat-log-types.ts`

- **`ChatLogRepository`**：`query(q)`、`facets(range)`，便于替换为非文件存储。
- **`UNSET_LEVEL_SENTINEL`**：字符串 `__UNSET__`，表示筛选「无 level」行。

## 4. 文档路径

- 迭代：`iterations/0.0.6/backend/data-models.md`
- 同步：`docs/backend/data-models-admin-log-viewer.md`
