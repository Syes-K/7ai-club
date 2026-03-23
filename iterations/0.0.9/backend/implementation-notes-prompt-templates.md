# 实现说明：提示词模板（version=0.0.9）

## 1. 模块

| 路径 | 职责 |
|------|------|
| `src/lib/prompt-templates/builtin.ts` | 内置默认模板、`PromptTemplateKey`、`PROMPT_TEMPLATE_KEYS` |
| `src/lib/prompt-templates/render.ts` | `collectPlaceholderNames`、`renderTemplateString` |
| `src/lib/prompt-templates/validate-save.ts` | `validatePromptTemplatesForSave`（与 UI 保存规则一致） |
| `src/lib/prompt-templates/inject-prefix.ts` | 摘要注入前缀：`{{content}}` 规则与校验 |
| `src/lib/prompt-templates/read-write.ts` | 读合并、`diskValueIsUsable` 回退、原子写、`renderPromptTemplate` |
| `src/lib/config/paths.ts` | `getPromptTemplatesFilePath()` |

## 2. 合并与容错

- 文件缺失：等价于全内置默认。  
- JSON 解析失败：`warning` + 全内置默认（见 `readPromptTemplatesWithMeta`）。  
- 单键合法但另一键非法或缺失：非法键不覆盖内置；合法键仍可采用磁盘值（`mergeFromDisk` + `diskValueIsUsable`）。  
- **注入前缀**：须满足 `inject-prefix` 规则（无占位符，或恰好一处末尾 `{{content}}`）；否则不采用磁盘值。  
- **摘要系统提示**若无 `{{maxChars}}` 子串，或出现非 `maxChars` 的占位符，则不采用磁盘值。

## 3. `context-summary.ts`

- **`messagesIncludeContextSummary`**：检测前缀为「无 `{{content}}` 时整段渲染结果」或「含 `{{content}}` 时以 `content: ""` 渲染的结果」；与首条 `system` 做 `startsWith`（设计 §2.1.1 方案 A）。  
- **`buildMessagesWithContextSummary`**：若模板含合法 `{{content}}`，则 `renderTemplateString(..., { content: 摘要 })`；否则渲染后前缀 + 摘要拼接。  
- **`refreshContextSummaryFullRewrite`**：`system` 为 `renderPromptTemplate("contextSummarySystem", { maxChars })`。

## 4. 与 0.0.5 文档的关系

- 原「固定前缀 / `buildContextSummarySystemPrompt`」已改为可配置模板；行为不变量（摘要 + 最近 K 条、不截断摘要正文等）仍见 `docs/backend/implementation-notes-chat-context-summary.md`。

## 5. 文档路径

- 迭代：`iterations/0.0.9/backend/implementation-notes-prompt-templates.md`  
- 同步：`docs/backend/implementation-notes-prompt-templates.md`
