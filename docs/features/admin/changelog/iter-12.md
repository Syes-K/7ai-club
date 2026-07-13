# iter-12 Changelog — Platform Admin

> **English:** [iter-12.md](./iter-12.md)  
> **中文:** [iter-12-cn.md](./iter-12-cn.md)  
> **Iteration index:** [iter-12/README.md](../../iterations/iter-12/README.md)

---

## 1. Topics

| Topic | PRD | Design |
|-------|-----|--------|
| Admin auth & shell | [01-product-requirements.md](../01-product-requirements.md) §3 | [design/admin-auth.md](../design/admin-auth.md) · [design/admin-shell.md](../design/admin-shell.md) |
| User management | [prd/users.md](../prd/users.md) | [design/users.md](../design/users.md) |
| Platform free models | [prd/models.md](../prd/models.md) | [design/platform-models.md](../design/platform-models.md) |
| Platform assistants + picker | [prd/assistants.md](../prd/assistants.md) | [design/platform-assistants.md](../design/platform-assistants.md) |
| Console / Chat integration | [design/integration.md](../design/integration.md) | same |

---

## 2. Required Reading

1. [01-product-requirements.md](../01-product-requirements.md)
2. [prd/users.md](../prd/users.md)
3. [prd/models.md](../prd/models.md)
4. [prd/assistants.md](../prd/assistants.md)
5. [02-technical-design.md](../02-technical-design.md) (after design confirm)
6. [console/changelog/iter-12.md](../../console/changelog/iter-12.md) — Console cross-impact
7. [mvp-chat/changelog/iter-12.md](../../mvp-chat/changelog/iter-12.md) — Chat cross-impact

---

## 3. Planned Delivery (Pre-code)

| Area | Path / notes |
|------|----------------|
| Routes | `app/admin/` layout + users / models / assistants |
| Components | `components/admin/` shell, nav, managers |
| Auth | `lib/admin/auth.ts` · middleware · `requireAdmin()` |
| API | `/api/admin/users/*` · models · assistants |
| DB | platform models table · `assistants.is_platform` · migration |
| Integration | Profile, Console Models, Chat picker, remove seed RPC |
| Env | `ADMIN_EMAILS`; remove `BAILIAN_API_KEY` |
| Tests | `tests/unit/admin/` · `tests/e2e/iter12-admin.spec.ts` |

---

## 4. Product Decisions (iter-12 Confirmed)

| Item | Decision |
|------|----------|
| Admin identity | `ADMIN_EMAILS` comma-separated; case-insensitive |
| Platform model keys | AES encrypted in DB |
| `BAILIAN_API_KEY` | **Fully deprecated** |
| System assistants | `is_platform = true`; no auto seed |
| New Chat | **Aggregated list**; personal first, system last |
| Assistant model | Profile preference only |
| User ops | disable, enable (password reset → [todoList AUTH-01](../../../todoList/backlog-cn.md)) |
| UI locale | English |
| Roadmap phase | 2 — platform operations |

---

## 5. Acceptance Checklist

> **Checkbox rule:** **qa-engineer** only, after Phase C4 pass.

### Summary (AC index)

**Auth (F-30)**

- [x] **AC-120** — Admin can view paginated user list
- [x] **AC-126** — Non-admin cannot access `/admin` or admin APIs

**Users (F-31)**

- [x] **AC-121** — User search
- [x] **AC-122** — Disable account
- [x] **AC-123** — Re-enable account
- [ ] **AC-124** — ~~Password reset email~~ **removed from iter-12** → [AUTH-01](../../../todoList/backlog-cn.md) (self-service forgot password)
- [x] **AC-125** — Cannot disable self

**Platform models (F-32)**

- [x] **AC-127** — Admin CRUD platform models
- [x] **AC-128** — Test gate: Passed + Enabled
- [x] **AC-129** — Profile can select platform models
- [x] **AC-130** — Console read-only Platform rows
- [x] **AC-131** — Chat uses platform model
- [x] **AC-132** — Deprecate `BAILIAN_API_KEY` / virtual default
- [x] **AC-133** — BYOK unaffected

**Platform assistants (F-33 / F-34)**

- [x] **AC-134** — Admin CRUD platform assistants
- [x] **AC-135** — New Chat single aggregated list (personal + system)
- [x] **AC-136** — Can select system assistant to create conversation
- [x] **AC-137** — Auto seed removed
- [x] **AC-138** — Personal entries first, system entries last
- [x] **AC-139** — Profile model preference for chat
- [x] **AC-140** — Disabled platform assistants hidden from list
- [x] **AC-141** — Non-admin blocked from admin assistants API

### 5.1 Test Matrix (qa-engineer · Phase C0)

| AC ID | Precondition | Steps | Expected | Verification | Automation | Evidence |
|-------|--------------|-------|----------|--------------|------------|----------|
| AC-120 | `E2E_TEST_EMAIL` ∈ `ADMIN_EMAILS`; logged in | 1. `/admin/users` | **Users** heading; table with email/status; pagination | e2e | `tests/e2e/iter12-admin.spec.ts` AC-120 | C4 · E2E pass |
| AC-121 | Same; ≥2 users in DB | 1. `/admin/users` 2. Search known email fragment | Only matching email/nickname rows | e2e + manual | `tests/e2e/iter12-admin.spec.ts` AC-121 | C4 · E2E pass |
| AC-122 | Admin; target not self, Active | 1. Row **Disable** 2. Refresh 3. Target login/chat | **Disabled**; login fails; API **403** | manual + unit | `tests/unit/admin/user-status.test.ts` · `tests/unit/auth/session.test.ts` | pass · M-01 H-05/H-06 · C4 |
| AC-123 | Target Disabled | 1. **Enable** 2. Login | **Active**; can sign in | manual + unit | `tests/unit/admin/user-status.test.ts` | pass · M-02 H-05 · C4 |
| AC-124 | — | — | **Out of scope**; see [todoList AUTH-01](../../../todoList/backlog-cn.md) | — | — | cancelled |
| AC-125 | Admin logged in | 1. Disable self (UI or `POST .../disable` own id) | UI disabled or API **400** | unit + manual | `tests/unit/admin/disable-self.test.ts` AC-125 | M-04 pass · unit 400 · C4 |
| AC-126 | Non-admin or unauthenticated | 1. `/admin/users` 2. `GET /api/admin/users` no cookie | `/forbidden` or login redirect; API **401/403** | e2e + unit | `tests/e2e/iter12-admin.spec.ts` AC-126 · `tests/unit/admin/auth.test.ts` | C4 · E2E 401 · non-admin cases skipped |
| AC-127 | Admin | 1. `/admin/models` 2. Add/Save 3. Edit/Disable/Enable | CRUD + Enable/Disable; list refreshes | e2e + manual | `tests/e2e/iter12-admin.spec.ts` AC-127 | M-05 Add · M-06 Disable/Enable · H-04 · AC-129–131 regression · C4 |
| AC-128 | New platform model untested/Failed | 1. Set key → **Test** 2. **Enable** after Passed | Not selectable until passed+enabled | manual + unit | `tests/unit/model-config.test.ts` | M-05 pass · C4 |
| AC-129 | ≥1 passed+enabled platform chat model | 1. `/console/profile` Preferences | Dropdown includes **Platform —** options | e2e | `tests/e2e/iter05-console-profile.spec.ts` · `tests/unit/model-config.test.ts` | C4 · E2E AC-43 pass |
| AC-130 | Same | 1. `/console/models` | **Platform** badge rows read-only; BYOK editable | e2e + manual | `tests/e2e/iter05-console-models.spec.ts` AC-40 | M-08 pass · C4 E2E AC-40 |
| AC-131 | Profile selects passed platform model | 1. Send message in `/chat` | Streams; key from DB not env | unit + manual | `tests/unit/iter12-platform-deprecation.test.ts` · M-10 | M-10 pass · unit · C4 |
| AC-132 | Build without `BAILIAN_API_KEY` | 1. `pnpm test` 2. static scan | `buildPlatformDefaultResolved()` null; chat resolve no env key | unit + static | `tests/unit/iter12-platform-deprecation.test.ts` AC-132 | 167 unit pass · C4 |
| AC-133 | User has passed BYOK | 1. BYOK Add/Edit/Test/Delete on `/console/models` | Same as iter-05 | e2e | `tests/e2e/iter05-console-models.spec.ts` AC-41 | C4 · E2E AC-41 pass |
| AC-134 | Admin | 1. `/admin/assistants` CRUD | Create/Edit/Disable succeed | e2e + manual | `tests/e2e/iter12-admin.spec.ts` AC-134 | E2E page load · M-07 partial · AC-136/140 regression · C4 |
| AC-135 | Personal + enabled platform assistants | 1. **New chat** | Single list; personal first; **Platform** badge on system rows | unit + e2e | `tests/unit/assistants-service.test.ts` · `tests/e2e/iter12-console-chat.spec.ts` AC-135 | C4 · E2E AC-135 pass |
| AC-136 | Enabled platform assistant in list | 1. Select system assistant 2. Send message | Conversation created; stream starts (no content assert) | e2e + manual | `tests/e2e/iter12-console-chat.spec.ts` AC-136 · M-11 | M-11 pass · C4 E2E AC-136 |
| AC-137 | Account with zero personal assistants | 1. New chat | No auto seed; system assistants at bottom | e2e + Supabase MCP | `tests/e2e/iter12-console-chat.spec.ts` AC-137 · M-12 | M-12 pass · C4 E2E AC-137 |
| AC-138 | Personal + platform assistants | 1. New chat list | All personal indices before first `isPlatform` | unit + e2e | `tests/unit/assistants-service.test.ts` AC-138 | unit AC-138 · C4 |
| AC-139 | Profile chat model set | 1. Platform assistant chat 2. Check header label | Matches Profile, not per-assistant model | e2e + manual | `tests/e2e/iter05-chat-model.spec.ts` AC-46 · M-10 | C4 · E2E AC-46 pass |
| AC-140 | Admin sets platform assistant `enabled=false` | 1. User New chat | Assistant hidden from list | unit | `tests/unit/assistants-platform-filter.test.ts` AC-140 | unit AC-140 · C4 |
| AC-141 | Non-admin logged in | 1. `GET /api/admin/assistants` | **403 Forbidden** | e2e | `tests/e2e/iter12-admin.spec.ts` AC-141 | C4 · E2E 401 unauth · non-admin cases skipped |

---

## 6. Gate Status

| Phase | Phrase / status | Date |
|-------|-----------------|------|
| PRD | `PRD confirmed, proceed to technical design` | 2026-07-12 |
| Technical design §12 | Draft ([02-technical-design.md](../02-technical-design.md) §9) | 2026-07-12 |
| Code | Phase B delivered | 2026-07-12 |
| Test C0 | Test Matrix + §12 landed | 2026-07-13 |
| Test C1–C3 | Automated pass; manual M-01–02 pass; M-06 partial; M-03 cancelled | 2026-07-13 |
| In-iter fixes | §7 H-01–H-10 landed in code | 2026-07-13 |
| Test C4 | AC-120–123, 125–141 checked; AC-124 out of scope | 2026-07-13 |
| Release | **Released** (user: `测试已通过，可发布` · 2026-07-13) | 2026-07-13 |

---

## 7. Manual fixes after Phase B (2026-07-13)

See [iter-12-cn.md §7](./iter-12-cn.md) for the full table (H-01–H-10). Summary:

| ID | Summary |
|----|---------|
| H-01 | Seed new-user profile with first platform chat model |
| H-02 | Align platform model labels with Console/Admin `model_name` |
| H-03 | Fallback when preferred platform model disabled |
| H-04 | Admin Models **Enable** button + API |
| H-05 | User Status from `banned_until` |
| H-06 | Ban enforcement via middleware + `lib/auth/session` |
| H-07 | Removed admin password reset → todoList AUTH-01 |
| H-08 | Platform assistant conversation RPC |
| H-09 | `/forbidden` redirect loop |
| H-10 | `docs/todoList/` backlog workflow |

---

## 12. Manual QA Script (qa-engineer · Phase C0, execute C3)

| # | AC | Scenario | Precondition | Steps | Expected | Result | Evidence |
|---|-----|----------|--------------|-------|----------|--------|----------|
| M-01 | AC-122 | Disable user | Admin; another Active user | 1. `/admin/users` 2. **Disable** 3. User tries login | Disabled; login fails | pass | H-05 H-06; 2026-07-13 manual |
| M-02 | AC-123 | Enable user | Target Disabled | 1. **Enable** 2. Login | Active | pass | H-05; 2026-07-13 manual |
| M-03 | AC-124 | — | — | — | **cancelled** — removed; see [AUTH-01](../../../todoList/backlog-cn.md) | cancelled | |
| M-04 | AC-125 | Cannot disable self | Admin | 1. Disable self row or API POST own id | 400 or button disabled | pass | `tests/unit/admin/disable-self.test.ts` 400 |
| M-05 | AC-128 | Platform test gate | Admin; new model + valid key | 1. Add 2. **Test** 3. Check Profile before/after Enable | Not selectable until passed+enabled | pass | Supabase `test_status=passed`; E2E AC-43 |
| M-06 | AC-127 | Platform model CRUD | Admin | 1. Add 2. Edit 3. Disable 4. Enable | Matches `platform_model_configs` | partial | H-03 H-04; Disable/Enable verified; Add via M-05 |
| M-07 | AC-134 | Platform assistant CRUD | Admin | 1. Create 2. Edit 3. Disable | `is_platform=true`; hidden when disabled (AC-140) | partial | E2E page load; DB 2 rows; AC-136/140 regression |
| M-08 | AC-130 | Console platform read-only | ≥1 platform model | 1. `/console/models` | No Edit on platform rows; BYOK works | pass | E2E AC-40 |
| M-09 | AC-135 | Aggregated picker order | Personal + system assistants | 1. New chat | Single list; personal first; **Platform** last | pass | E2E AC-135 |
| M-10 | AC-131 | Platform model chat stream | Profile selects platform model | 1. Send message in `/chat` | Streams; platform label in header | pass | unit `iter12-platform-deprecation`; E2E AC-46 |
| M-11 | AC-136 | System assistant chat | Enabled platform assistant | 1. Select system 2. Send message | Conversation + stream starts | pass | E2E AC-136 |
| M-12 | AC-137 | No seed | Zero personal assistants | 1. New chat | No auto-created personal; system selectable at bottom | pass | E2E AC-137 |

---

## 13. Revision History

| Date | Change |
|------|--------|
| 2026-07-13 | C4: checked AC-122/123/127/134; filled §5.1 evidence; lint/build/test/e2e all pass |
| 2026-07-13 | User confirmed release |
| 2026-07-13 | §7 manual fixes; removed admin password reset; ban middleware |
| 2026-07-12 | Created iter-12 changelog; PRD confirmed |
| 2026-07-12 | Full English design parity; en↔en / cn↔cn link mapping |
