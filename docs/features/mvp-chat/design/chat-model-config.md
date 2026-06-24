# Chat Model Integration — Technical Design

> **English:** [chat-model-config.md](./chat-model-config.md)  
> **中文:** [chat-model-config-cn.md](./chat-model-config-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/chat-model-config.md](../prd/chat-model-config.md)  
> **Iteration:** iter-05

---

## 1. Design Goals

- Chat `modelLabel` from Profile-selected config (incl. platform default)
- `POST /api/chat` uses matching provider + model + key
- Server enforces `test_status === passed`; remove `NEXT_PUBLIC_LLM_PROVIDER` from UI path

---

## 2. Resolution

`lib/llm/resolve-user-model.ts` — `resolveUserModelForChat(userId, preferredConfigId)`:

- `NULL` → platform Bailian + `BAILIAN_API_KEY`
- UUID → owned config, `passed` only, decrypt via `service_role`

`getChatModelForResolvedConfig(resolved)` — per-config API key, not global env.

---

## 3. `/api/chat`

Replace `getChatModel(assistant.model, profile.preferred_model)` with resolved config path. See [chat-model-config-cn.md](./chat-model-config-cn.md) §3.

---

## 4. Browser Label

`app/chat/layout.tsx` injects `preferredModelLabel`; `conversation-session` uses layout value (no re-fetch on switch).

---

## 5. Files

See [chat-model-config-cn.md](./chat-model-config-cn.md) §7.

---

## 6. Revision History

| Date | Change |
|------|--------|
| 2026-06-17 | iter-05 initial |
