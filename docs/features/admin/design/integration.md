# Console / Chat Integration — Technical Design (iter-12 cross)

> **English:** [integration.md](./integration.md)  
> **中文:** [integration-cn.md](./integration-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **Iteration:** iter-12

---

## 1. Scope

This file describes **admin iter-12** code changes in `console` and `mvp-chat` (not admin routes themselves).

---

## 2. Console Models (C-12-01 – C-12-03)

| File | Change |
|------|--------|
| `lib/console/model-configs.ts` | `listModelConfigsForUser` merges `listPlatformModelConfigsForUser`; platform rows `readOnly: true` |
| `components/console/models-manager.tsx` | Hide Edit/Delete/Test/Update key on platform rows |
| `components/console/preferences-card.tsx` | Dropdown includes platform UUIDs; remove sentinel ID branch |
| `lib/services/browser/profile.ts` | `allowedIds` includes platform passed rows |

---

## 3. Chat model (mvp-chat)

| File | Change |
|------|--------|
| `lib/llm/resolve-user-model.ts` | Platform table resolve + decrypt |
| `lib/llm/provider.ts` | Remove `buildPlatformDefaultResolved` env branch |
| `app/chat/layout.tsx` | Label from merged config |
| `lib/workflow/nodes/resolve-model.ts` | No interface change; uses new resolve |
| `lib/memory/resolve-summary-model.ts` | Fallback chain includes platform models |

---

## 4. New Chat picker

| File | Change |
|------|--------|
| `lib/services/browser/assistants.ts` | `listAssistantOptions` aggregation |
| `components/chat/assistant-picker-dialog.tsx` | Platform badge, sort order |
| `app/api/conversations/route.ts` | Validate platform `assistantId` |

---

## 5. Deprecation list

| Item | Action |
|------|--------|
| `PLATFORM_DEFAULT_CONFIG_ID` | Remove UI dependency; update tests |
| `BAILIAN_API_KEY` | Remove reads; drop from `.env.example` |
| `mergePlatformDefault` | Delete |
| `ensure_user_assistants` INSERT | SQL replaced with SELECT-only |
| `getPlatformTemplateModel` for seed | Delete or admin migration only |

---

## 6. Cross changelog §12 (regression AC)

| AC | Console / Chat verification |
|----|----------------------------|
| AC-129 | Profile e2e |
| AC-130 | `/console/models` e2e |
| AC-133 | BYOK CRUD e2e |
| AC-131–132 | `tests/unit/resolve-user-model*.ts` |
| AC-135–138 | `assistant-picker` e2e |
| AC-136 | System assistant conversation e2e |
| AC-139 | workflow unit |

---

## 7. Revision history

| Date | Change |
|------|--------|
| 2026-07-12 | iter-12 cross-integration initial draft |
