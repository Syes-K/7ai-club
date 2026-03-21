# 服务端实现说明：JSON 配置与 API（version=0.0.4）

**关联设计**：`iterations/0.0.4/design/spec-console-config-json.md`

---

## 1. 模块

| 路径 | 说明 |
|------|------|
| `src/lib/config/defaults.ts` | `AppConfig` 类型与 `FALLBACK_DEFAULTS` |
| `src/lib/config/paths.ts` | `APP_CONFIG_PATH` / `.data/app-config.json` |
| `src/lib/config/merge.ts` | 磁盘部分 JSON 与默认合并（容错） |
| `src/lib/config/read-write.ts` | `getAppConfig`、`readAppConfigWithMeta`、原子写 |
| `src/lib/config/validate-save.ts` | `PUT` 严格校验 |
| `src/lib/config/index.ts` | 对外导出 |

---

## 2. 接入点

| 路径 | 变更 |
|------|------|
| `src/lib/chat/validate-request.ts` | `maxMessagesInContext`、`defaultModel` 来自 `getAppConfig()` |
| `src/app/api/chat/route.ts` | session 分支上下文裁剪用 `getAppConfig().maxMessagesInContext` |
| `src/lib/chat/providers.ts` | DeepSeek `model` 固定 `DEEPSEEK_DEFAULT_MODEL`（`constants.ts`） |
| `src/lib/chat/run-chat-stream.ts` | 日志字段 `model`：智谱用请求体；DeepSeek 用 `DEEPSEEK_DEFAULT_MODEL` |
| `src/lib/chat/logger.ts` | `chatLoggingEnabled === false` 时整函数早退；写文件失败时不再 `console.error` |
| `src/lib/chat/route-key.ts` | `DEFAULT_CHAT_ROUTE` 与 `FALLBACK_DEFAULTS` 对齐（客户端静态默认） |
| `src/lib/chat/constants.ts` | `MAX_MESSAGES_IN_CONTEXT` 等与默认对齐；`DEEPSEEK_DEFAULT_MODEL` 为固定 id |
| `src/app/layout.tsx` | `generateMetadata` + `dynamic = force-dynamic`，`title` 用 `appDisplayName` |
| `src/app/api/console/config/route.ts` | `GET` / `PUT` |
| `src/app/api/config/public/route.ts` | 客户端可读子集 |

---

## 3. 前端（0.0.4 已对齐）

- `/console` 表单、`ChatApp` 拉取 `/api/config/public`：见 `docs/frontend/implementation-notes-console-config.md`。

---

## 4. 自测

1. 无文件时 `GET /api/console/config` → 默认 + `warning: null`。  
2. `PUT` 非法 `defaultModel` → 400。  
3. `PUT` 合法后 `GET` → 持久化一致；发对话请求上下文条数随 `maxMessagesInContext` 变。  
4. `chatLoggingEnabled: false` 后无 `[chat]` 控制台与文件追加。

---

## 5. 文档路径

- 迭代：`iterations/0.0.4/backend/implementation-notes-console-config.md`
- 同步：本文档
