# 实现说明：管理端日志查看（服务端，version=0.0.6）

## 1. 代码布局

| 路径 | 职责 |
|------|------|
| `src/lib/logs/chat-log-types.ts` | `ChatLogRepository` 接口与查询类型 |
| `src/lib/chat/log-dir.ts` | 统一日志根路径 `<cwd>/.logs` |
| `src/lib/logs/chat-log-file-repository.ts` | 文件 JSONL 实现：读 `.logs/`，按小时文件与请求时间窗求交后扫描 |
| `src/lib/logs/log-query-range.ts` | 解析查询时间窗：ISO `start`/`end` **或** `date`/`hour`（服务器本地日历日），与 `GET /api/console/logs`、`facets` 共用 |
| `src/lib/logs/index.ts` | 导出默认 `chatLogRepository`（可在此切换实现） |
| `src/app/api/console/logs/route.ts` | `GET` 分页查询 |
| `src/app/api/console/logs/facets/route.ts` | `GET` level/event 汇总 |

## 2. 性能与限制

- **扫描行上限**：单次 `query` 最多处理 **200_000** 条非空行；`facets` 为 **80_000**。超出则停止继续读文件，`scanTruncated: true`。
- **内存**：当前实现将**所有命中条件的行**载入内存后再排序、分页；数据量极大时可能占用较高内存，后续可改为堆外流式或索引。
- **文件选择**：仅打开「小时文件时间窗」与请求 `[startMs,endMs]` **在绝对时间上相交**的文件（文件名按服务器本地时区解析为整点起点）。

## 3. 与设计差异 / 约定

- **requestId**：实现为**前缀匹配**（与设计「二选一」已定稿一致）。
- **keyword**：对解析后的对象 `JSON.stringify` 后做子串匹配（与设计「整行或字段子集」中取整对象序列化一种固定策略）。
- **level 多选**：选中的多个 level 为 **OR**；与 `event`、`时间` 等为 **AND**。
- **错误响应**：500 不返回 `detail`，避免泄露路径或内部信息。

## 4. 自测建议

1. `GET /api/console/logs`（可省略 `start`/`end` 用默认窗）：应 **200**（有日志时 `total`≥0）；**无** 403 门禁。
2. 带 `start`/`end` 缩窄窗口 + `event` 重复参数，检查 OR 语义。
3. `date=YYYY-MM-DD`（不传 `hour`）与 `date=...&hour=14`：时间窗与服务器本地日历一致；与 `start`/`end` 同传应 **400**。

## 5. 文档路径

- 迭代：`iterations/0.0.6/backend/implementation-notes-admin-log-viewer.md`
- 同步：`docs/backend/implementation-notes-admin-log-viewer.md`
