# LLM 可靠性（多提供商 · 百炼 · 错误提示）

> **English:** [llm-reliability.md](./llm-reliability.md)  
> **中文：** [llm-reliability-cn.md](./llm-reliability-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-01 / iter-02

---

## 1. 范围

F-14 多 LLM 提供商（env）、F-15 百炼 abort 修复与错误提示改进。

---

## 2. F-14 多提供商（iter-01，已交付）

| Provider | 默认模型（示例） |
|----------|------------------|
| `siliconflow` | 见 `lib/llm/provider.ts` |
| `nvidia` | deepseek-v4-flash 等 |
| `bailian` | `qwen3.6-plus` |

- `LLM_PROVIDER` + `LLM_MODEL` 环境变量
- Key 仅服务端；无应用内切换 UI

**AC-09（v0.1）已替代：** 不再固定 SiliconFlow + Qwen2.5-7B。

---

## 3. F-15 百炼稳定性（iter-02）

### 背景

`LLM_PROVIDER=bailian` + `qwen3.6-plus` 时可能出现 SSE：

```
start → start-step → abort ("This operation was aborted") → [DONE]
```

无 `text-delta`。疑因 `CHAT_CHUNK_TIMEOUT_MS`（15s）与思考模型首 token 延迟冲突。

### 计划修复

| 任务 | 说明 |
|------|------|
| T-01 | 确认根因；查 `LLM stream error:` 日志 |
| T-02 | 调大 chunk 超时和/或 `enable_thinking: false` |
| T-03 | `BAILIAN_API_KEY` ↔ `BAILIAN_BASE_URL` 地域一致 |
| T-04 | 区分 timeout / region / key 的用户错误文案 |

相关代码：`app/api/chat/route.ts`、`lib/llm/provider.ts`、`lib/llm/timeout.ts`。

---

## 4. 验收标准

- [x] **AC-09**：多提供商 env 配置（iter-01）
- [x] **AC-19**：bailian 流式不再无故 abort（代码：60s chunk + `enable_thinking: false`；**需手测**）
- [x] **AC-20**：LLM 错误可读 English 文案

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-15 | iter-02 从总纲拆出 |
| 2026-06-16 | 本地实现完成 |
