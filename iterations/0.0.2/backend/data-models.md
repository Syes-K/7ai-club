# 数据模型与存储端口（version=0.0.2）

**关联**：`api-spec.md`、实现 `src/lib/chat/store/`

---

## 1. SQLite 表

### 1.1 `chat_sessions`

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | TEXT PK | UUID |
| `created_at` | INTEGER | Unix ms |
| `updated_at` | INTEGER | Unix ms |
| `title` | TEXT NULL | 首条用户消息节选；空会话为 NULL |

### 1.2 `chat_messages`

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | TEXT PK | UUID |
| `session_id` | TEXT FK | → `chat_sessions.id`，ON DELETE CASCADE |
| `role` | TEXT | `user` \| `assistant` \| `system`（当前写入主要为前两者） |
| `content` | TEXT | 全文 |
| `created_at` | INTEGER | Unix ms |

索引：`(session_id, created_at)` 用于按会话顺序列出消息。

---

## 2. TypeScript 端口 `ChatStore`

定义于 `src/lib/chat/store/port.ts`，方法摘要：

| 方法 | 说明 |
|------|------|
| `listSessions()` | 摘要列表，按 `updated_at` 降序 |
| `createSession()` | 新建会话行 |
| `sessionExists(id)` | 是否存在 |
| `listMessages(sessionId)` | 按时间升序 |
| `appendMessage(sessionId, role, content)` | 插入消息并更新会话 `updated_at` |
| `clearMessages(sessionId)` | 删除该会话全部消息 |
| `maybeSetTitleFromUserMessage` | 标题为空时写入节选 |
| `touchSession` | 更新 `updated_at`（当前主要由 `appendMessage` 覆盖） |

默认实现：`SqliteChatStore`（`sqlite-store.ts`）。**业务与路由**仅依赖 `getChatStore(): ChatStore`（`store/index.ts`），便于替换为 PostgreSQL 等实现。

---

## 3. 扩展其他数据库

1. 新建类实现 `ChatStore` 全部方法，语义与 SQLite 版一致（含排序、标题规则）。  
2. 在 `store/index.ts` 中根据环境变量选择实现（例如 `CHAT_STORE=postgres`），或注入测试用 mock。  
3. 注意 Next.js **Node runtime** 下连接池生命周期：避免每请求新建昂贵连接；可用进程级单例（与当前 SQLite 相同模式）。

---

## 4. 文档路径

- 迭代：`iterations/0.0.2/backend/data-models.md`
- 同步：`docs/backend/data-models-chat-sessions-sqlite.md`
