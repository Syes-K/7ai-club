# Loading UX — 全局规范

> **English:** [loading-ux.md](./loading-ux.md)  
> **中文:** [loading-ux-cn.md](./loading-ux-cn.md)

> **范围：** 所有用户可见的异步操作（Console、Chat、Auth）。  
> **状态：** iter-05 确立 · iter-05 审计扩展  
> **文案：** 用户可见 loading 文案为 **English**。

---

## 1. 原则

1. **锁定操作范围** — mutation 进行中，同范围内其他操作应禁用，避免竞态与重复提交。
2. **mutation 禁止仅 Action 级** — 单按钮 `Saving…`、其他行操作仍可点，**不符合**列表页与多操作界面规范。
3. **与数据获取方式一致** — RSC 首屏用 `loading.tsx`；客户端首屏拉取用 `usePageBusy`。
4. **分层反馈** — 范围遮罩/锁定 **加上** 弹窗内按钮文案（若有 modal）。
5. **每范围同一时间一个进行中的 mutation** — 页面、区块或 Chat 主面板。

---

## 2. Loading 层级

| 层级 | 场景 | 机制 | 示例 |
|------|------|------|------|
| **A. 路由首屏（RSC）** | Server 页面 await DB 后首屏 | `app/<route>/loading.tsx` + `ConsolePageLoading` | `/console/models`、`/console/profile` |
| **B. 路由首屏（客户端）** | 挂载后 client fetch | mount 时 `usePageBusy("Loading …")` | `/console/assistants` |
| **C. 页面 / 面板 busy** | 列表 CRUD、测试、删除；Chat 主区 | 遮罩 + 内容 `pointer-events-none` | Models 变更；Chat 删除 / 切换会话 |
| **D. 区块 busy** | 同页多块独立保存 | 每 Card `ConsoleSection` 遮罩 | Profile Account / Preferences |
| **E. 行内 / 列表项** | 已在 busy 范围内的辅助指示 | 侧栏行 spinner、`Loading…` | Chat 切换会话时侧栏项 |
| **F. 仅 Dialog / 按钮** | **仅作补充** — 不能单独承担 C/D | `Saving…`、`Deleting…`、`Clearing…` | 页面 busy 下的表单弹窗 |
| **G. 流式 / 状态** | AI 长响应 | 框架 status + 输入禁用 | `useChat` + `Thinking…` |
| **H. 全局** | 整应用退出 | 菜单项禁用 + 文案 | 登出 `Signing out…` |

Console mutation **不要**用全站遮罩 — 过重。

---

## 3. 决策树（新增 action）

```
是否为路由首次渲染？
├─ 是，数据来自 RSC（page.tsx async）
│   └─ 添加 app/<segment>/loading.tsx（层级 A）
├─ 是，数据来自客户端 useEffect
│   └─ mount 时 usePageBusy（层级 B）
└─ 否 — 用户触发的异步
    ├─ Console 列表页（行操作 + 页头 CTA）？
    │   └─ ConsolePage + runBusy（C）+ 弹窗按钮文案（F）
    ├─ Console 多 Card 表单页？
    │   └─ 每 Card ConsoleSection（D）+ 按钮文案（F）
    ├─ Chat 主面板（删除、切换、清空）？
    │   └─ ChatNavigationFeedback 或等效面板遮罩（C）
    ├─ Chat 侧栏列表拉取？
    │   └─ listLoading 行内（E）
    ├─ Chat 发消息 / 流式？
    │   └─ useChat status（G）
    ├─ Auth 表单提交？
    │   └─ 按钮禁用 + Please wait…（F）
    └─ 登出 / session 结束？
        └─ 菜单禁用 + Signing out…（H）
```

---

## 4. Console

**细则：** [features/console/design/console-shell-cn.md](./features/console/design/console-shell-cn.md) §8。

### 4.1 组件

| 组件 | 职责 |
|------|------|
| `ConsolePage` | `busy` / `busyLabel` — 页面级遮罩 |
| `ConsoleSection` | Card 级遮罩 |
| `ConsoleBusyOverlay` | 共用 spinner + 文案 |
| `ConsolePageLoading` | RSC `loading.tsx` 骨架 |
| `usePageBusy` | `runBusy(label, asyncFn)` |

### 4.2 规则

- `busy` 时禁用页头 CTA。
- `busy` 时禁用表格操作；打开 dialog 前 `if (busy) return`。
- **API + 列表刷新** 包在同一 `runBusy` 内。
- mutation 中 dialog 打开：页面保持 busy；dialog 内显示 `Saving…` / `Deleting…`。

### 4.3 各路由首屏

| 路由 | 模式 |
|------|------|
| `/console/models` | RSC → `models/loading.tsx`（A） |
| `/console/profile` | RSC → `profile/loading.tsx`（A） |
| `/console/assistants` | 客户端 → `runBusy("Loading assistants…")`（B） |

新增列表页：优先 **B**（遮罩一致）或纯 RSC 用 **A** — 禁止首屏无任何 A/B 反馈。

---

## 5. Chat

**壳细则：** [features/console/design/chat-integration-cn.md](./features/console/design/chat-integration-cn.md)。

### 5.1 组件

| 组件 | 职责 |
|------|------|
| `ChatNavigationFeedback` | 主面板遮罩 — `loading` / `slow` / `timeout` / **`deleting`** |
| `ChatSidebar` | `listLoading`、`pendingId` 行内 spinner |
| `ChatAppShell` | `deletingId`、`pendingId`、`listLoading` 编排 |
| `AssistantPickerDialog` | 打开时 `Loading assistants…` |
| `ClearChatDialog` | 按钮 `Clearing…`（F）；主面板遮罩为可选增强 |

### 5.2 规则

- **切换会话：** `pendingId` + 侧栏 `Loading…` + `ChatNavigationFeedback`（C + E）。
- **删除会话：** `deletingId` → 面板 `deleting`；禁用侧栏导航；dialog `Deleting…`（C + F）。切下一对话前清除 `deletingId` 再 `loadConversation`。
- **侧栏首屏：** `listLoading` — 显示 `Loading conversations…`，不闪空态（E）。
- **新建会话：** 按钮 `creating`（F）。
- **发消息：** 非 `ready` 时禁用输入；`Thinking…`（G）。

---

## 6. Auth

| 操作 | 模式 |
|------|------|
| 登录 / 注册 | `AuthForm` — `Please wait…`、禁用提交（F） |
| 登出 | `UserMenu` — `Signing out…`、禁用菜单项（H） |

---

## 7. 文案约定

| 场景 | 示例 |
|------|------|
| Console 首屏 | `Loading models…`、`Loading profile…`、`Loading assistants…` |
| Console mutation | `Adding model…`、`Testing model…`、`Deleting model…`、`Saving account…` |
| Chat 导航 | `Loading conversation…`、`Still loading…`、`Deleting conversation…` |
| Chat 列表 | `Loading conversations…`、`Loading assistants…` |
| 弹窗 | `Saving…`、`Deleting…`、`Clearing…`、`Creating…` |
| Auth | `Please wait…`、`Signing out…` |

使用 **动词 + 省略号**（`…`），文案需对应具体操作。

---

## 8. 无障碍

- 遮罩：`aria-busy="true"`、`role="status"`、`aria-live="polite"`。
- 锁定范围内禁用可交互元素，而非仅视觉隐藏。
- 不仅依赖颜色 — 需 spinner 或文字。

---

## 9. 反模式

| 避免 | 原因 |
|------|------|
| 仅 Test 按钮 `Testing…`，其他行操作仍可点 | 竞态 |
| 客户端列表 fetch 完成前显示空态 | 闪「无数据」 |
| 删除仅有 dialog 按钮，主面板不锁 | 用户仍可操作过期会话 |
| `runBusy` 但未禁用页头 CTA | 重复创建 |
| 同页多个并发 `runBusy` | UI 状态不确定 |

---

## 10. 清单（新增异步 action）

- [ ] 用 §3 确定层级（A–H）
- [ ] 锁定范围（页 / 区块 / 面板 / 按钮）
- [ ] 选定英文文案（§7）
- [ ] 遮罩设置 `aria-busy`（如适用）
- [ ] 错误路径清除 busy（`finally` / `catch`）
- [ ] 新界面在 feature `design/` 中一行引用本文档

---

## 11. 采用矩阵（iter-05）

| 界面 | 首屏 | Mutation |
|------|------|----------|
| Console Models | `loading.tsx`（A） | `runBusy`（C） |
| Console Profile | `loading.tsx`（A） | `ConsoleSection`（D） |
| Console Assistants | `runBusy`（B） | `runBusy`（C） |
| Chat 侧栏 | `listLoading`（E） | — |
| Chat 切换会话 | — | `ChatNavigationFeedback`（C） |
| Chat 删除 | — | `deleting`（C）+ dialog（F） |
| Chat 清空 | — | 仅 dialog（F）* |
| Chat 发消息 | — | `useChat`（G） |
| Auth | — | 按钮（F）/ 登出（H） |

\*清空聊天：MVP 仅 dialog 可接受；可与删除对齐加主面板遮罩。

---

## 12. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-17 | 全局规范 — iter-05 审计，Console + Chat + Auth |
