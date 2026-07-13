# iter-12 Changelog — console (admin cross-revision)

> **English:** [iter-12.md](./iter-12.md)  
> **中文:** [iter-12-cn.md](./iter-12-cn.md)  
> **Iteration index:** [iter-12/README.md](../../iterations/iter-12/README.md)  
> **Primary changelog:** [admin/changelog/iter-12.md](../../admin/changelog/iter-12.md)

---

## 1. Topics

Cross-impact of **iter-12 (admin)** on Console. New admin capabilities: [admin feature](../../admin/README.md).

| Topic | PRD | Design |
|-------|-----|--------|
| Models — platform rows | [prd/models.md](../prd/models.md) §7 | [design/models.md](../design/models.md) §14 |
| Profile Preferences | [prd/profile.md](../prd/profile.md) §3.3 | [design/models.md](../design/models.md) §14 |
| Assistants — no seed | [prd/assistants.md](../prd/assistants.md) §3.4 | [admin/design/platform-assistants.md](../../admin/design/platform-assistants.md) |
| New Chat picker | [prd/chat-assistant-picker.md](../prd/chat-assistant-picker.md) §3.2 | [admin/design/integration.md](../../admin/design/integration.md) §4 |

**Index revision:** [01-product-requirements.md](../01-product-requirements.md) §2.3–2.4 (v0.4)

---

## 2. Required Reading

1. [admin/changelog/iter-12.md](../../admin/changelog/iter-12.md) — primary AC-120–141
2. [admin/01-product-requirements.md](../../admin/01-product-requirements.md)
3. Console sub-PRDs iter-12 sections (table above)
4. [iter-12/README.md](../../iterations/iter-12/README.md)

---

## 3. Planned Delivery (Pre-code)

| ID | Area | Summary |
|----|------|---------|
| C-12-01 | `app/console/models` | Merge read-only platform rows (**Platform** badge); user BYOK unchanged |
| C-12-02 | `components/console/models-manager.tsx` | No Edit/Delete/Test/Update key on platform rows |
| C-12-03 | Profile Preferences | Dropdown merges passed platform chat models + user BYOK |
| C-12-04 | `components/console/assistants-manager.tsx` | Only `user_id = auth.uid()`; remove seed trigger |
| C-12-05 | `components/chat/assistant-picker-dialog.tsx` | Single aggregated list; personal first, system last |
| C-12-06 | `lib/services/browser/assistants.ts` | List platform assistants; remove / no-op `ensureUserAssistants` copy |
| C-12-07 | `lib/console/model-configs*.ts` | Remove `PLATFORM_DEFAULT` virtual injection; read platform table |
| C-12-08 | Regression | BYOK CRUD/Test, Profile Save, Console nav unaffected |

**Deprecates:** env `BAILIAN_API_KEY`, sentinel `PLATFORM_DEFAULT_CONFIG_ID`, `ensure_user_assistants` template copy.

---

## 4. Product Decisions (iter-12 · Console)

| Item | Decision |
|------|----------|
| Platform models in Console | **Read-only**; CRUD only at `/admin/models` |
| Personal assistants | Console `/console/assistants` unchanged (CRUD own) |
| System assistants | Not in Console; New Chat aggregated list (after personal) |
| Zero personal assistants | No auto seed; system assistants still selectable at list bottom |
| Chat model | Still from Profile; no per-assistant model |

---

## 5. Acceptance (Console regression index)

> **Checkbox rule:** Primary AC in [admin/changelog/iter-12.md](../../admin/changelog/iter-12.md) §5. This section is Console **regression** index.

- [ ] **AC-129** — Profile can select passed platform models
- [ ] **AC-130** — Console Models read-only Platform rows
- [ ] **AC-133** — User BYOK CRUD/test unaffected
- [ ] **AC-135** — New Chat single aggregated list; personal before system
- [ ] **AC-136** — Can select system assistant from list
- [ ] **AC-137** — Auto seed removed
- [ ] **AC-138** — List order: personal first, system last

### 5.1 Test Matrix (qa-engineer · Phase C0)

| AC ID | Precondition | Steps | Expected | Verification | Automation | Evidence |
|-------|--------------|-------|----------|--------------|------------|----------|
| AC-130 | Admin configured ≥1 passed platform model | 1. `/console/models` 2. Check platform row actions | **Platform** read-only rows; BYOK rows editable | e2e + manual | `tests/e2e/iter05-console-models.spec.ts` AC-40 · M-C12-01 | |
| AC-133 | Existing passed BYOK config | 1. Add/Edit/Test/Delete BYOK | Same as iter-05 | e2e | `tests/e2e/iter05-console-models.spec.ts` AC-41 | |
| AC-135 | Logged in; personal + system assistants | 1. New chat | Single list; personal first; **Platform** badge on system rows | e2e | `tests/e2e/iter12-console-chat.spec.ts` AC-135 · M-C12-02 | |
| AC-137 | New user with zero personal assistants | 1. New chat | No seed; system assistants at list bottom | e2e + manual | `tests/e2e/iter12-console-chat.spec.ts` AC-137 · M-C12-03 | |

---

## 6. Gate Status

| Phase | Status | Date |
|-------|--------|------|
| PRD cross-revision | Landed | 2026-07-12 |
| Technical design | [admin/02-technical-design.md](../../admin/02-technical-design.md) · [design/models.md](../design/models.md) §14 | 2026-07-12 |
| Code | Phase B delivered | 2026-07-12 |
| Test C0–C4 | Matrix landed; follows admin primary changelog | 2026-07-13 |
| Release | **Released** (user: `测试已通过，可发布` · 2026-07-13) | 2026-07-13 |

---

## 12. Manual QA Script (qa-engineer · Phase C0, execute C3)

| # | AC | Scenario | Precondition | Steps | Expected | Result | Evidence |
|---|-----|----------|--------------|-------|----------|--------|----------|
| M-C12-01 | AC-130 | Console platform read-only | Admin configured platform model | 1. `/console/models` 2. Try Edit platform row | No Edit/Delete; BYOK works | | |
| M-C12-02 | AC-135 | Aggregated picker | Logged in; personal + system assistants | 1. New chat | Single list; system after personal | | |
| M-C12-03 | AC-137 | No seed | Account with zero personal assistants | 1. New chat | No auto-create; system selectable at bottom | | |

---

## 13. Revision History

| Date | Change |
|------|--------|
| 2026-07-12 | Created console iter-12 cross changelog |
| 2026-07-12 | F-34 picker → single aggregated list (no dual tabs) |
| 2026-07-12 | Expanded English parity; en→en link mapping |
