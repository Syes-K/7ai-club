# iter-05 Changelog — User Model Configuration

> **English:** [iter-05.md](./iter-05.md)  
> **中文:** [iter-05-cn.md](./iter-05-cn.md)  
> **Iteration index:** [iter-05/README.md](../../iterations/iter-05/README.md)

---

## 1. Themes

| Theme | PRD | Design |
|-------|-----|--------|
| Models management (BYOK + test) | [prd/models.md](../prd/models.md) | *TBD — tech design* |
| Profile dual cards + Preferences | [prd/profile.md](../prd/profile.md) | *TBD — tech design* |

Affects **console**; Chat display in [mvp-chat changelog iter-05](../../mvp-chat/changelog/iter-05.md).

---

## 2. Required Reading

1. [prd/models.md](../prd/models.md)
2. [prd/profile.md](../prd/profile.md)
3. [mvp-chat/prd/chat-model-config.md](../../mvp-chat/prd/chat-model-config.md)

---

## 3. Planned Code Changes (fill during implementation)

### 3.1 Add (expected)

```
app/console/models/
app/api/models/test/
components/console/models-*
components/console/profile-*
supabase/migrations/
lib/llm/
tests/unit/ iter-05-*.test.ts
tests/e2e/iter05-*.spec.ts
```

### 3.2 Modify (expected)

```
app/console/profile/page.tsx
components/console/profile-form.tsx
app/api/chat/route.ts
app/chat/layout.tsx
lib/services/browser/profile.ts
lib/services/browser/model-label.ts
lib/constants/model-options.ts
lib/validation/profile.ts
```

### 3.3 Cross-cutting (iter-05)

- **Global Loading UX** — [loading-ux.md](../../loading-ux.md) (decision tree, Console + Chat + Auth).
- **Console busy loading** — page-level (`ConsolePage` + `usePageBusy`) for Models / Assistants; section-level (`ConsoleSection`) for Profile cards. Console index: [design/console-shell.md](../design/console-shell.md) §8.

```
components/console/console-page.tsx
components/console/console-section.tsx
components/console/console-busy-overlay.tsx
components/console/console-page-loading.tsx
components/console/use-page-busy.ts
app/console/models/loading.tsx
app/console/profile/loading.tsx
```

---

## 4. Acceptance Checklist

- [x] **AC-40** — Models CRUD; no key in network
- [x] **AC-41** — Separate Update API key flow
- [x] **AC-42** — Test Passed/Failed persisted; Passed only selectable
- [x] **AC-43** — Profile Preferences Passed only
- [x] **AC-44** — Independent Account / Preferences save
- [x] **AC-45** — Profile default Detail + Edit
- [x] **AC-46** — Chat modelLabel matches Preferences
- [x] **AC-47** — User key / platform env key
- [x] **AC-48** — Untested/Failed not consumable

---

## 5. Manual QA

| # | Scenario | E2E | Manual |
|---|----------|-----|--------|
| 1 | New user sees Platform default Passed | — | [x] |
| 2 | Add → Test Passed → Profile selectable | AC-42/43 | [x] |
| 3 | Test Failed → not selectable / chat blocked | AC-48 | [x] |
| 4 | Update key → Untested → re-test | AC-41/48 | [x] |
| 5 | Account save does not change Preferences | AC-44 | [x] |
| 6 | Preferences save does not change nickName | AC-44 | [x] |
| 7 | Chat uses selected model key | AC-47 | [x] |
| 8 | Delete current preference — blocked | models §3.9 | [x] |

---

## 6. Automated Tests (qa-engineer after implementation)

| AC | Test files |
|----|------------|
| AC-40–42 | `tests/unit/model-config.test.ts`, `tests/e2e/iter05-console-models.spec.ts` |
| AC-43–45 | `tests/unit/profile-validation.test.ts`, `tests/e2e/iter05-console-profile.spec.ts` |
| AC-46 | `tests/e2e/iter05-chat-model.spec.ts` |
| AC-47–48 | Manual QA (LLM / provider) |

---

## 7. Revision History

| Date | Change |
|------|--------|
| 2026-06-17 | Created iter-05 changelog — PRD confirmed |
| 2026-06-17 | §3.3 Console busy loading spec → console-shell §8 |
| 2026-06-17 | Global [loading-ux.md](../../loading-ux.md) — loading audit + RSC loading.tsx |
| 2026-06-24 | QA passed; AC-40–48 checked |
