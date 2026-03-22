# API 说明：会话上下文摘要（version=0.0.5）

## 1. 变更范围

- **无**新增 HTTP 路由；行为变更集中在 **`POST /api/chat`**（`variant !== legacy` 的会话模式）与 **`PUT /api/console/config`**（应用配置字段扩展）。
- **`GET /api/config/public`**：本迭代**不**暴露摘要相关字段（摘要仅存服务端）。

---

## 2. `POST /api/chat`（会话模式）

### 2.1 请求体

与 0.0.2 一致，无新字段。

### 2.2 服务端组装 `messages`（发往模型）

1. 从存储读取当前会话全部消息，按时间序。
2. 取 **最近 K 条** `ChatMessage`（`K = getAppConfig().maxMessagesInContext`）。
3. 若 **`contextSummaryEnabled`** 为 `true` 且持久化条数 **`n > K`**：  
   - 读取会话的 `context_summary`；若非空，则在消息列表前插入 **一条** `role: system`，正文为固定前缀 + 摘要全文（见 `src/lib/chat/context-summary.ts` 中 `CONTEXT_SUMMARY_MODEL_PREFIX`）。**不在服务层**按 `contextSummaryMaxChars` 对摘要正文截取。  
   - 若摘要为空或功能关闭：仅最近 K 条（与旧版一致）。
4. **legacy** 模式不变（仍仅按 `maxMessagesInContext` 裁剪 body 内 `messages`）。

### 2.3 摘要刷新（成功写入 assistant 之后）

在流式结束且 **`afterSuccess`** 持久化 assistant 后：

1. 令 `n` = 当前会话持久化消息条数，`K` = `maxMessagesInContext`。  
2. 若 `!contextSummaryEnabled` 或 `n <= K`：不刷新。  
3. 否则若满足 **触发条件**：  
   - `summary_message_count_at_refresh <= 0`（尚未因摘要逻辑更新过计数），或  
   - `n - summary_message_count_at_refresh >= contextSummaryRefreshEvery`  
   则调用 **整段重写**摘要（见 `data-models-chat-context-summary-0.0.5.md` / `implementation-notes-chat-context-summary.md`）。  
4. **整段重写成功时**：将模型返回文本 `trim()` 后写入 `context_summary`。`contextSummaryMaxChars` 通过摘要调用的系统提示（`buildContextSummarySystemPrompt`）约束模型在目标长度内输出；若模型仍超长，**不在服务层**截取，全文落库。  
5. 摘要 API **失败**时：记录日志；将 `summary_message_count_at_refresh` 更新为当前 `n` 以**退避**重试频率，并**保留**已有摘要正文（若有）。

---

## 3. `PUT /api/console/config`

### 3.1 新增字段（JSON）

| 字段 | 类型 | 约束 |
|------|------|------|
| `contextSummaryEnabled` | boolean | 必填 |
| `contextSummaryMaxChars` | number | 200～8000 整数 |
| `contextSummaryRefreshEvery` | number | 1～200 整数 |

校验：`validateAppConfigForSave`（`src/lib/config/validate-save.ts`）。

---

## 4. 错误与降级

- 摘要生成失败：**不**影响 `POST /api/chat` 的 200 与流式正文；模型请求在无摘要或旧摘要下仍用最近 K 条。
