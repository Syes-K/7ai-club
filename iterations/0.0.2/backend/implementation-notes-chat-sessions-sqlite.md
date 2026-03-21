# 服务端实现说明：多会话 SQLite 与精简 POST /api/chat（version=0.0.2）

**关联需求**：`iterations/0.0.2/product/prd-chat-sessions-sqlite.md`  
**关联设计**：`iterations/0.0.2/design/spec-chat-sessions-sqlite.md`

---

## 1. 依赖

| 包 | 用途 |
|----|------|
| `better-sqlite3` | SQLite 同步驱动（Node runtime） |
| `@types/better-sqlite3` | TypeScript 类型（devDependency） |

---

## 2. 配置

| 项 | 说明 |
|----|------|
| `next.config.ts` | `serverExternalPackages: ["better-sqlite3"]`，避免打包器错误解析原生模块 |
| `CHAT_SQLITE_PATH` | 可选；默认 `<cwd>/.data/chat.sqlite` |
| `.gitignore` | 忽略 `.data/` |

---

## 3. 代码变更摘要

| 路径 | 说明 |
|------|------|
| `src/lib/chat/store/port.ts` | `ChatStore` 接口与 `storedToChatMessages` |
| `src/lib/chat/store/sqlite-store.ts` | SQLite 实现、建表迁移 |
| `src/lib/chat/store/index.ts` | `getChatStore()` 进程单例 |
| `src/lib/chat/validate-request.ts` | `legacy` / `session` 双模式校验 |
| `src/lib/chat/run-chat-stream.ts` | 抽取 SSE 流与 `afterSuccess` 钩子（持久化 assistant）；`api.persist_failed` 日志 |
| `src/app/api/chat/route.ts` | 分支 legacy / session；session 下先写 user、再读库组装上下文、成功后写 assistant |
| `src/app/api/chat/sessions/route.ts` | GET 列表、POST 创建 |
| `src/app/api/chat/sessions/[sessionId]/messages/route.ts` | GET 消息、DELETE 清空 |

---

## 4. 行为说明

- **Legacy**：行为与 0.0.2 前一致，便于前端分步迁移。  
- **Session 新消息**：先持久化 user（流失败时末条为 user，可 `retryLast`）。  
- **Session 重试**：要求末条为 `user`；不重复插入 user。  
- **上下文裁剪**：服务端 `storedToChatMessages(...).slice(-MAX_MESSAGES_IN_CONTEXT)`，与常量 `src/lib/chat/constants.ts` 一致。  
- **日志**：`api.request_received` 在 session 模式下记录 `sessionId`、`retryLast`、`messageCount`，**不**再打全量消息正文（控制体积）。

---

## 5. 自测建议

1. `POST /api/chat/sessions` → 得 `id`。  
2. `POST /api/chat` body：`sessionId` + `content` + `provider`（及智谱 `model`）→ SSE 正常，再 `GET .../messages` 可见 user + assistant。  
3. 故意让流失败（如断网）：末条为 user，`retryLast: true` 可再拉一轮。  
4. `DELETE .../messages` 后列表为空，会话仍在。  
5. `GET /api/chat/sessions` 顺序为最近更新在前。

---

## 6. 已知限制

- **Serverless / 只读文件系统**：SQLite 文件路径须可写；Vercel 等无持久磁盘环境需换存储实现。  
- 前端已于 **0.0.2** 接入 session 模式；见 `docs/frontend/implementation-notes-chat-sessions-sqlite.md`。

---

## 7. 文档路径

- 迭代：`iterations/0.0.2/backend/implementation-notes-chat-sessions-sqlite.md`
- 同步：`docs/backend/implementation-notes-chat-sessions-sqlite.md`
