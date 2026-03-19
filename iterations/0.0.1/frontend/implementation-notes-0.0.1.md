# 前端实现说明：迭代 0.0.1（对话页布局与按钮）

**version**：`0.0.1`  
**设计依据**：`iterations/0.0.1/design/spec-chat-layout-buttons-0.0.1.md`

---

## 1. 改动摘要

| 项 | 说明 |
|----|------|
| 模型选择 | 自 footer 移至 **顶栏右侧**，与「清空对话」同组；`id="model-select"` + `label` 保留。 |
| Footer | 仅 **textarea + 发送**；`textarea` `min-w-0 flex-1`，发送 `shrink-0 self-end`。 |
| 图标 | `SendIcon`（纸飞机）、`TrashIcon`、`RefreshIcon`，线框 `stroke` 与 `BotIcon` 一致；按钮为 **图标 + 中文**。 |
| 焦点 | 顶栏清空、footer 发送、错误重试使用 `focus-visible:ring-2` + `ring-violet-500`（发送另设 `ring-offset`）。 |
| 空态 | 引导文案改为「在顶栏选择模型后…」。 |
| 响应式 | 顶栏 `flex-wrap`；模型区 `sm:max-w-[min(100%,14rem)]` + `min-w-0`。 |

---

## 2. 主文件

- `src/components/chat/ChatApp.tsx`

---

## 3. 自测清单（手测）

- [ ] 顶栏切换模型后新消息走新 provider/model；历史消息不丢。  
- [ ] `busy` 时 select、清空、发送均不可用（视觉 `opacity-40` / `disabled`）。  
- [ ] 无消息时清空禁用。  
- [ ] 发送、清空、重试 Tab 焦点环可见。  
- [ ] 窄屏下顶栏换行后仍可操作模型与清空。  

---

## 4. 文档路径

- 主路径：`iterations/0.0.1/frontend/implementation-notes-0.0.1.md`  
- 同步：`docs/frontend/implementation-notes-0.0.1.md`
