# 服务端说明：迭代 0.0.1（对话页布局与按钮）

**version**：`0.0.1`  
**关联需求**：`iterations/0.0.1/product/prd-chat-layout-buttons.md`  
**关联设计**：`iterations/0.0.1/design/spec-chat-layout-buttons-0.0.1.md`

---

## 1. 结论：无服务端代码变更

本迭代仅调整 **前端布局**（模型选择迁至顶栏、footer 精简、按钮图标），**不改变**：

- `POST /api/chat` 的路径、方法、请求体、响应与 SSE 事件形状  
- `provider` / `model` 校验与智谱模型列表来源  
- 环境变量与上游调用逻辑  

**权威契约**仍以 `docs/backend/api-spec.md`、`docs/backend/data-models.md`、`docs/backend/implementation-notes.md` 为准。

---

## 2. 接口契约（对照）

| 项 | 0.0.1 是否变更 |
|----|----------------|
| `POST /api/chat` | 否 |
| 新增/废弃端点 | 否 |
| 数据模型 / 持久化 | 否（首版仍无会话落库） |

---

## 3. 自测建议

- **无需**为本迭代单独新增服务端用例。  
- 回归：前端对接不变，可选用现有对话流程做一次 **发送 → 流式 → 错误/重试** 烟测（在阶段 4 前端完成后执行亦可）。

---

## 4. 文档路径

- 主路径：`iterations/0.0.1/backend/implementation-notes-0.0.1.md`  
- 同步：`docs/backend/implementation-notes-0.0.1.md`
