# 前端实现说明：/console 与公开配置（version=0.0.4）

**关联设计**：`iterations/0.0.4/design/spec-console-config-json.md`

---

## 1. 文件

| 路径 | 说明 |
|------|------|
| `src/app/console/layout.tsx` | 全高 `min-h-[100dvh]` 容器 |
| `src/app/console/page.tsx` | 服务端读 `readAppConfigWithMeta()`；顶栏 + 安全提示 + `ConsoleConfigForm` |
| `src/components/console/ConsoleConfigForm.tsx` | 客户端：表单、`PUT /api/console/config`、恢复默认（需再保存） |
| `src/lib/config/public-config-client.ts` | `fetchPublicAppConfig()` → `GET /api/config/public` |
| `src/components/chat/ChatApp.tsx` | 挂载时拉公开配置，同步 provider / 智谱模型 / 展示名；DeepSeek 选项文案用 `DEEPSEEK_DEFAULT_MODEL`；`document.title`；**不**在对话页提供 `/console` 入口（须自行输入 URL 或内网入口） |

---

## 2. 行为摘要

- **管理页**：无登录；顶栏文案与安全条按设计；保存成功/失败条各约 4s；文件解析警告来自 `initialFileWarning`。
- **对话页**：公开 API 失败时保持 `FALLBACK_DEFAULTS` 与 `DEFAULT_CHAT_ROUTE` 行为，不阻断聊天。

---

## 3. 文档路径

- 迭代：`iterations/0.0.4/frontend/implementation-notes-console-config.md`
- 同步：本文档
