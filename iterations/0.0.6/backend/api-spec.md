# API：管理端日志查看（version=0.0.6）

**关联需求**：`iterations/0.0.6/product/prd-admin-log-viewer.md`  
**关联设计**：`iterations/0.0.6/design/spec-admin-log-viewer.md`

---

## 1. 访问控制（本迭代）

本迭代 **不设** 日志专用 API 门禁：不校验环境变量密钥、不要求请求头 `x-log-viewer-secret`。谁能访问与整站 **Console**（`/console`）一致，依赖**部署侧**网络边界、网关鉴权等；勿将管理端暴露公网。

---

## 2. `GET /api/console/logs`

分页查询落盘日志行（与 `0.0.1` 一致的 **JSONL**，每行一个对象）。

### 2.1 Query 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `start` | 与 `end` 成对可选 | ISO 8601，区间**下界**（闭区间）；与 `date` **互斥** |
| `end` | 与 `start` 成对可选 | ISO 8601，区间**上界**（闭区间）；与 `date` **互斥** |
| `date` | 否 | `YYYY-MM-DD` 日历日；与 `start`/`end` **互斥**。与可选 `hour` 组合表示**服务器本地时区**下的日历日或整点小时（与落盘按小时切分一致） |
| `hour` | 否 | `0`～`23` 整数；**仅**与 `date` 同传；省略或空表示该 `date` 的**全天**（本地 00:00:00.000～23:59:59.999） |
| `level` | 否 | 可重复；不传或全部为空表示**不限**。取值含项目 JSON 中的 `level` 字符串；另支持哨兵 **`__UNSET__`** 表示仅匹配**无/空 `level`** 的行 |
| `event` | 否 | 可重复；多条之间为 **OR**；不传或空表示不限 |
| `requestId` | 否 | **前缀匹配**（区分大小写）；空表示不限 |
| `keyword` | 否 | 不区分大小写；对**整行对象 `JSON.stringify` 结果**做子串匹配；空表示不限 |
| `page` | 否 | 默认 `1`，最小 `1` |
| `pageSize` | 否 | 默认 `20`，范围 `1`～`100` |

**时间窗（三选一语义）**：

1. **缺省**：`date`、`start`、`end` **均未提供**时，使用「**当前时刻起往前 1 小时**」`[now-1h, now]`（闭区间）。
2. **ISO 区间**：`start` 与 `end` **成对**提供（均为有效 ISO 8601）；**只传其一**则 **400**。
3. **日历日 + 可选小时**：提供 `date` 时，**不得**再带 `start`/`end`。不传 `hour`（或空）表示该**服务器本地日历日**全天；传 `hour` 表示该本地**整点小时**。单独传 `hour` 而无 `date` → **400**。

实现见 `src/lib/logs/log-query-range.ts`（`GET /api/console/logs` 与 `GET /api/console/logs/facets` 共用）。

**筛选组合语义**：`level`（多选）之间为 **OR**；`event`（多选）之间为 **OR**；**维度之间**（时间、`level`、`event`、`requestId`、`keyword`）为 **AND**。

**时间判定**：仅当行内存在可 `Date.parse` 的 **`ts`** 字符串，且其 UTC 瞬时点落在 `[start,end]`（闭区间）内时命中；无 `ts` 或不可解析的行**不进入**时间窗结果。

### 2.2 响应 200

```json
{
  "items": [ { "ts": "...", "level": "info", "event": "api.request_received", "requestId": "..." } ],
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "scanTruncated": false,
  "scannedLines": 1200
}
```

| 字段 | 说明 |
|------|------|
| `items` | 当前页原始 JSON 对象数组（字段随事件变化） |
| `total` | 本次扫描中**符合全部条件**的总条数（再分页） |
| `page` / `pageSize` | 实际使用的分页参数 |
| `scanTruncated` | 是否因**扫描行数上限**提前停止读文件（见 implementation-notes） |
| `scannedLines` | 本次查询累计读取的非空行数（含未命中过滤器的行） |

### 2.3 错误

| 状态 | `code` | 说明 |
|------|--------|------|
| 400 | `LOG_QUERY_RANGE` | 时间窗不合法：如 `start`/`end` 只传一半、`date` 与 `start`/`end` 混用、仅有 `hour` 无 `date`、`date` 格式错误、`hour` 非 0～23、或 end \< start、ISO 无效等 |
| 500 | `LOG_READ_FAILED` | 读取失败；**不**在响应体中返回服务器路径或栈 |

---

## 3. `GET /api/console/logs/facets`

在指定时间窗内（扫描上限内）汇总出现过的 **`level`**、**`event`** 取值，供筛选 UI。

### 3.1 Query 参数

与 `GET /api/console/logs` 的时间窗规则相同（`start`/`end` **或** `date`/`hour`，或缺省为最近 1 小时；互斥与校验一致）。

### 3.2 响应 200

```json
{
  "levels": ["error", "info", "warn"],
  "events": ["api.request_received", "provider.request_ok"],
  "scanTruncated": false,
  "scannedLines": 800
}
```

- 仅统计**落在时间窗内**且 `ts` 可解析的行。
- **`__UNSET__`** 由前端作为固定选项展示，不由本接口返回。

---

## 4. 文档路径

- 迭代：`iterations/0.0.6/backend/api-spec.md`
- 同步：`docs/backend/api-spec-admin-log-viewer.md`
