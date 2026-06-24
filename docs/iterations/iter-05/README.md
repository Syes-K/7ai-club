# iter-05 — User Model Configuration & Profile Preferences

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-05`  
> **Status:** **Released**  
> **Roadmap phase:** 1 — MVP chat + configuration UI  
> **Planned release:** —  
> **Actual release:** 2026-06-24  
> **Git tag (optional):** `iter-05`

---

## 1. Iteration Goals

- [x] Ship Console **Models** page: users configure provider + model name + API key; only **Passed** configs are consumable
- [x] Refactor **Profile** into Account / Preferences dual cards (View → Edit → independent Save)
- [x] **Chat** displays and uses the Profile-selected, tested provider + model
- [x] Platform default **Bailian `qwen3.6-plus`** (env `BAILIAN_API_KEY`) available for all users

---

## 2. Scope

### In Scope

| Area | Change |
|------|--------|
| Console Models | CRUD, encrypted API keys, separate Update key flow, model test, platform default row |
| Console Profile | Dual cards, Detail/Edit modes, Preferences dropdown (Passed only) |
| Chat | modelLabel from user config; `/api/chat` uses matching key |
| Docs | PRD + changelog (this iteration) |
| Tests | Unit + E2E (qa-engineer during implementation) |

### Out of Scope

- Technical design (awaiting user instruction to start fullstack-developer)
- Knowledge Base / MCP
- Anthropic / Azure OpenAI / custom OpenAI-compatible provider
- Per-assistant model picker
- Org / multi-tenant, rate limits, cost monitoring
- Removing global env LLM provider (still used for platform default key)

---

## 3. Features Included

| Slug | Changelog | Status |
|------|-----------|--------|
| `console` | [changelog/iter-05.md](../../features/console/changelog/iter-05.md) | Released |
| `mvp-chat` | [changelog/iter-05.md](../../features/mvp-chat/changelog/iter-05.md) | Released |

**Required PRDs:**

1. [console/prd/models.md](../../features/console/prd/models.md)
2. [console/prd/profile.md](../../features/console/prd/profile.md) (iter-05 revision)
3. [mvp-chat/prd/chat-model-config.md](../../features/mvp-chat/prd/chat-model-config.md)

---

## 4. Acceptance

### 4.1 Automated

- [x] `pnpm lint` passes
- [x] `pnpm build` passes
- [x] `pnpm test` passes
- [x] `pnpm test:e2e` passes

### 4.2 Manual QA

See [console changelog §5](../../features/console/changelog/iter-05.md) — passed.

### 4.3 Release

- [x] All changelog AC-40–48 checked
- [x] User confirmed: tests passed, ready to release

---

## 5. Dependencies & Risks

| Item | Notes |
|------|-------|
| Depends on | iter-04 browser data layer, iter-03 Console shell |
| Risk | API key encryption TBD in technical design; test endpoint subject to provider rate limits |
| Mitigation | Keys decrypted on Node only; minimal completion for test; timeout + error summary |

---

## 6. Revision History

| Date | Change |
|------|--------|
| 2026-06-17 | Created iter-05 — PRD confirmed |
| 2026-06-24 | QA passed; iteration released |
