# 实现说明：会话上下文摘要（version=0.0.5）

## 1. 模块与文件

| 路径 | 职责 |
|------|------|
| `src/lib/chat/context-summary.ts` | 组装带 system 摘要的 `messages`、整段重写刷新、触发判断 |
| `src/lib/chat/providers.ts` | `fetchChatCompletionText` 非流式补全（智谱 / DeepSeek） |
| `src/lib/chat/store/port.ts` / `sqlite-store.ts` | 摘要列、`getSessionContextSummary` / `setSessionContextSummary`；`clearMessages` 清空摘要 |
| `src/app/api/chat/route.ts` | 会话模式使用 `buildMessagesWithContextSummary`；`afterSuccess` 内 `maybeRefresh` |
| `src/lib/config/*` | 新配置项与校验 |
| `src/components/console/ConsoleConfigForm.tsx` | 控制台表单 |

---

## 2. 触发与退避

- **触发**：`shouldRefreshContextSummary`（见源码）。首次 `n > K` 且 `summary_message_count_at_refresh <= 0` 时会尝试刷新。  
- **成功**：写入 `context_summary` 与 `summary_message_count_at_refresh = n`。  
- **失败**：`context_summary` 保留原值；仍将 `summary_message_count_at_refresh = n`，避免在摘要 API 持续失败时对每条消息重复调用。

---

## 3. 自测建议

1. **关闭摘要**：行为与 0.0.4 前一致（仅最近 K 条）。  
2. **开启摘要**，`K=2`，`refreshEvery=1`，发多轮至 `n>2`：检查日志 `context_summary.refreshed`；数据库 `context_summary` 非空。  
3. **清空当前会话消息**：摘要列应清空。  
4. **删除会话**：行删除，无残留。

---

## 4. 文档路径

- 迭代：`iterations/0.0.5/backend/`
- 同步：`docs/backend/`（`api-spec-chat-context-summary-0.0.5.md`、`data-models-chat-context-summary-0.0.5.md`、本文件）
