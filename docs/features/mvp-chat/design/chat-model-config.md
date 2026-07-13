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
| 2026-07-12 | iter-12 — platform model resolve from DB; remove `BAILIAN_API_KEY` — see §10 |

---

## 10. iter-12 delta (admin cross)

> **Primary design:** [admin/design/platform-models.md](../../admin/design/platform-models.md) · [admin/design/integration.md](../../admin/design/integration.md) §3  
> **Changelog:** [changelog/iter-12.md](../changelog/iter-12.md)

### 10.1 Resolution chain

```
Profile.preferred_model_config_id
  → user_model_configs (must match user_id + passed)
  → platform_model_configs (must be passed + enabled)
  → fallback: first passed+enabled+chat platform model
```

| File | Change |
|------|--------|
| `lib/llm/resolve-user-model.ts` | Platform table resolve + `decrypt`; remove env default branch |
| `lib/llm/provider.ts` | Remove `buildPlatformDefaultResolved` / `BAILIAN_API_KEY` |
| `app/chat/layout.tsx` | `modelLabel` from merged config |
| `lib/workflow/nodes/resolve-model.ts` | No interface change; uses new resolve |
| `lib/memory/resolve-summary-model.ts` | Fallback chain includes platform models |

### 10.2 Error copy (English, same semantics)

| Scenario | HTTP |
|----------|------|
| No passed platform model and no BYOK | 503 |
| Preference points to untested/failed | 502 |

### 10.3 Regression AC

AC-131, AC-132, AC-139, AC-48 — see [admin/02-technical-design.md](../../admin/02-technical-design.md) §9.
