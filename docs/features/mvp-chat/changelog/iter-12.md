# iter-12 Changelog — mvp-chat (admin cross-revision)

> **English:** [iter-12.md](./iter-12.md)  
> **中文:** [iter-12-cn.md](./iter-12-cn.md)  
> **Iteration index:** [iter-12/README.md](../../iterations/iter-12/README.md)  
> **Primary changelog:** [admin/changelog/iter-12.md](../../admin/changelog/iter-12.md)

---

## 1. Topics

Cross-impact of **iter-12 (admin)** on Chat model resolution and New Chat flow.

| Topic | PRD | Design |
|-------|-----|--------|
| Chat modelLabel + `/api/chat` key source | [prd/chat-model-config.md](../prd/chat-model-config.md) | [design/chat-model-config.md](../design/chat-model-config.md) §10 |
| New Chat aggregated list | [console/prd/chat-assistant-picker.md](../../console/prd/chat-assistant-picker.md) §3.2 | [console/changelog/iter-12.md](../../console/changelog/iter-12.md) |

---

## 2. Required Reading

1. [admin/changelog/iter-12.md](../../admin/changelog/iter-12.md) — primary AC-120–141
2. [prd/chat-model-config.md](../prd/chat-model-config.md) — iter-12 revision
3. [console/changelog/iter-12.md](../../console/changelog/iter-12.md) — picker / seed
4. [iter-12/README.md](../../iterations/iter-12/README.md)

---

## 3. Planned Delivery (Pre-code)

| Area | Summary |
|------|---------|
| `app/api/chat/route.ts` and workflow/stream | Platform model key from DB decrypt; **remove** `BAILIAN_API_KEY` branch |
| `lib/llm/` model resolve | Unified: user BYOK or `platform_model_configs` passed row |
| `app/chat/layout.tsx` | `modelLabel` from merged Profile config (incl. platform) |
| `lib/services/browser/model-label.ts` | Remove virtual `PLATFORM_DEFAULT` label logic |
| `POST /api/conversations` | Accept platform assistant `assistantId` (`is_platform = true`) |
| `components/chat/assistant-picker-dialog.tsx` | Single aggregated list (shared with console C-12-05) |
| Unit / E2E | Update AC-47 related tests: platform key no longer from env |

**Unchanged:** Assistant `system_prompt` from selected assistant; **no** per-assistant model.

---

## 4. Product Decisions (iter-12 · Chat)

| Item | Decision |
|------|----------|
| Platform model key | DB AES decrypt (same as BYOK) |
| `BAILIAN_API_KEY` | **Fully deprecated** |
| No preference fallback | First passed + enabled platform chat model |
| No model available | 503 + English guidance to `/console/models` or contact admin |
| System assistant chat | Same Chat path as personal; model still from Profile |

---

## 5. Acceptance

> Primary AC checkboxes: [admin/changelog/iter-12.md](../../admin/changelog/iter-12.md) §5.

- [ ] **AC-131** — Chat uses selected platform model decrypted key
- [ ] **AC-132** — Remove `BAILIAN_API_KEY` / virtual `PLATFORM_DEFAULT` code paths
- [ ] **AC-136** — System assistant conversation streams normally
- [ ] **AC-139** — Platform assistant chat uses Profile model preference
- [ ] **AC-48** (regression) — Untested/failed configs still rejected server-side

### 5.1 Test Matrix (qa-engineer · Phase C0)

| AC ID | Precondition | Steps | Expected | Verification | Automation | Evidence |
|-------|--------------|-------|----------|--------------|------------|----------|
| AC-131 | Profile selects passed platform model | 1. Send message in `/chat` | Streams; no env key dependency | unit + manual | `tests/unit/iter12-platform-deprecation.test.ts` · M-M12-01 | |
| AC-132 | Deploy without `BAILIAN_API_KEY` | 1. `pnpm test` 2. static scan | Pass; chat resolve does not read env | unit + static | `tests/unit/iter12-platform-deprecation.test.ts` AC-132 | |
| AC-136 | Select system assistant in list | 1. New chat 2. Send message | Conversation created + stream starts | e2e + manual | `tests/e2e/iter12-console-chat.spec.ts` AC-136 · M-M12-02 | |
| AC-48 | User BYOK untested/failed | 1. Send with untested model | Server rejects (ModelNotReady) | unit | `tests/unit/model-config.test.ts` regression | |

---

## 6. Gate Status

| Phase | Status | Date |
|-------|--------|------|
| PRD cross-revision | Landed | 2026-07-12 |
| Technical design | [design/chat-model-config.md](../design/chat-model-config.md) §10 | 2026-07-12 |
| Code | Phase B delivered | 2026-07-12 |
| Test | Matrix landed; follows admin primary changelog | 2026-07-13 |
| Release | **Released** (user: `测试已通过，可发布` · 2026-07-13) | 2026-07-13 |

---

## 12. Manual QA Script (qa-engineer · Phase C0, execute C3)

| # | AC | Scenario | Precondition | Steps | Expected | Result | Evidence |
|---|-----|----------|--------------|-------|----------|--------|----------|
| M-M12-01 | AC-131 | Platform model chat | Admin configured passed platform model; Profile selected | 1. `/chat` send message | Normal streaming reply | | |
| M-M12-02 | AC-136 | System assistant chat | Admin configured enabled platform assistant | 1. Select system assistant 2. Send message | Platform assistant prompt + Profile model | | |

---

## 13. Revision History

| Date | Change |
|------|--------|
| 2026-07-12 | Created mvp-chat iter-12 cross changelog |
| 2026-07-12 | Expanded English parity; en→en link mapping |
