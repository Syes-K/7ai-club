# iter-05 Changelog — Chat Model Integration

> **English:** [iter-05.md](./iter-05.md)  
> **中文:** [iter-05-cn.md](./iter-05-cn.md)  
> **Iteration index:** [iter-05/README.md](../../iterations/iter-05/README.md)

---

## 1. Theme

| Theme | PRD | Design |
|-------|-----|--------|
| Chat modelLabel + `/api/chat` routing | [prd/chat-model-config.md](../prd/chat-model-config.md) | *TBD — tech design* |

Depends on [console/prd/models.md](../../console/prd/models.md) and [console/prd/profile.md](../../console/prd/profile.md).

---

## 2. Required Reading

1. [prd/chat-model-config.md](../prd/chat-model-config.md)
2. [console/changelog/iter-05.md](../../console/changelog/iter-05.md)

---

## 3. Planned Changes (fill during implementation)

| Area | Change |
|------|--------|
| `app/api/chat/route.ts` | Resolve provider + model + key from Profile user model config |
| `app/chat/layout.tsx` | Inject full preferred config |
| `lib/services/browser/conversation-session.ts` | `modelLabel` from user config |
| `lib/services/browser/model-label.ts` | Remove `NEXT_PUBLIC_LLM_PROVIDER` dependency |
| `lib/llm/provider.ts` | Per-request user key + provider |

---

## 4. Acceptance Checklist

- [x] **AC-46** — modelLabel `{Provider} — {modelName}` matches Profile
- [x] **AC-47** — User key / platform `BAILIAN_API_KEY`
- [x] **AC-48** — Server rejects Untested/Failed configs

---

## 5. Revision History

| Date | Change |
|------|--------|
| 2026-06-17 | Created iter-05 mvp-chat changelog |
| 2026-06-24 | QA passed; AC-46–48 checked |
