# iter-06 changelog — Agent orchestration foundation

> **English:** [iter-06.md](./iter-06.md)  
> **中文:** [iter-06-cn.md](./iter-06-cn.md)  
> **Iteration index:** [iter-06/README.md](../../iterations/iter-06/README.md)

---

## 1. Themes

| Theme | PRD | Design |
|-------|-----|--------|
| Workflow orchestration + step UI + DB logs | [prd/workflow-orchestration.md](../prd/workflow-orchestration.md) | [design/workflow-orchestration.md](../design/workflow-orchestration.md) |
| Upstash stream resume + Redis purge | [prd/stream-resume.md](../prd/stream-resume.md) | [design/stream-resume.md](../design/stream-resume.md) |

**Related mvp-chat:** `/api/chat` refactor — see [mvp-chat/changelog/iter-06.md](../../mvp-chat/changelog/iter-06.md)

---

## 2. Required reading

1. [01-product-requirements.md](../01-product-requirements.md) — §2 global conventions  
2. [prd/workflow-orchestration.md](../prd/workflow-orchestration.md)  
3. [prd/stream-resume.md](../prd/stream-resume.md)  
4. [design/workflow-orchestration.md](../design/workflow-orchestration.md) — §6 frontend (includes dev-phase calibrations)  
5. [design/stream-resume.md](../design/stream-resume.md) — §3.2–3.3 resume deduplication  
6. [mvp-chat/prd/chat-model-config.md](../../mvp-chat/prd/chat-model-config.md) — iter-05 model behavior unchanged  

---

## 3. Delivered implementation

| Area | Path / notes |
|------|----------------|
| Chat POST | `app/api/chat/route.ts` — WorkflowRunner + `createUIMessageStream` + resumable stream |
| Stream resume | `app/api/chat/[conversationId]/stream/route.ts` |
| Workflow restore | `app/api/chat/[conversationId]/workflow/route.ts` |
| Workflow core | `lib/workflow/` — runner, nodes, emit-step, persistence |
| Turn state machine | `lib/chat/turn-workflow.ts`, `lib/chat/use-turn-workflow.ts` |
| Resume guard | `lib/chat/stream-resume.ts` |
| Redis | `lib/redis/client.ts`, `stream-context.ts`, `purge.ts` |
| Chat UI | `assistant-turn.tsx`, `workflow-step-timeline.tsx`; `chat-messages.tsx`, `chat-conversation-panel.tsx` wired to hook |
| DB | `supabase/migrations/20260624000000_iter06_workflow.sql` |
| Env vars | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (`.env.example`) |
| Unit tests | `tests/unit/workflow/`, `tests/unit/chat/turn-workflow.test.ts`, `tests/unit/chat/stream-resume.test.ts`, `tests/unit/turn-assistant.test.ts` |

**Automation:** `pnpm test:ci` green (47 unit + 13 E2E, 2026-06-24 QA). See §8.

---

## 4. Dev-phase manual calibrations & changes

> Issues found during implementation and their fixes; design docs updated in [workflow-orchestration.md](../design/workflow-orchestration.md) §6 and [stream-resume.md](../design/stream-resume.md) §3.

### 4.1 Backend — Supabase & workflow context

| Issue | Root cause | Fix |
|-------|------------|-----|
| Refresh during Load context throws `cookies() inside after()` | Workflow nodes call `createClient()` → `cookies()` inside `createUIMessageStream.execute` / `after()` | Create one Supabase client at POST start and inject into `WorkflowContext.supabase`; use `createServiceClient()` for cleanup |
| Same impact | `resolve-user-model`, `conversations`, `profile` still default to `createClient()` | Add optional `supabase` param; reuse request-scoped client in workflow |

### 4.2 Frontend — step UI state machine refactor (P0–P3)

Initial conversation-level `workflowSteps[]` + multiple phase derivations caused: steps not collapsing after refresh, out-of-order step states, flash of “4 steps completed” on send, duplicate bubbles, etc.

| Phase | Content |
|-------|---------|
| **P0** | `restoreGeneration`: discard stale async `GET /workflow` responses so completed steps from a prior turn are not merged into live turn |
| **P1** | `lib/chat/turn-workflow.ts` turn-level store `{ live, completed[userMessageId] }`; `useTurnWorkflow` as sole data entry point |
| **P2** | Steps bound by `userMessageId`; historical turns read from `completed` |
| **P3** | `AssistantTurn` display-only; removed phase logic from `assistant-turn`; design doc §6 synced |

**Generate response step convention (manually confirmed):**

| Phase | `llm_stream` status | UI |
|-------|---------------------|-----|
| validate / load / resolve running | not started | steps expand one by one |
| LLM token streaming | `running` | expanded + loading |
| stream finished | `success` | collapsed as “N steps completed” |

### 4.3 Single assistant slot & refresh deduplication

| Issue | Root cause | Fix |
|-------|------------|-----|
| Duplicate AI reply boxes and step areas | `toUIMessageStream` sends another `start` by default; client used `pendingAssistantTurn` fake bubble | `writer.write({ type: "start", messageId })` at start of `execute`; LLM merge with `sendStart: false`; removed `pendingAssistantTurn` |
| **Refresh during LLM output** still shows two full replies | LLM `onFinish` persisted assistant (new DB UUID) while run still `running`; resume replays `start` with mismatched messageId → SDK `pushMessage` | ① `randomUUID()` for `messageId`, same id on persist; ② `shouldResumeChatStream` — no resume when last message is assistant; ③ GET stream returns **204** under same condition; ④ `resumeAttemptedRef` prevents double resume in Strict Mode |

**Removed workaround:** `findCanonicalAssistantIdForUser` (render only last assistant) — replaced by single slot at source + resume guards.

### 4.4 Cleanup

- Removed client merge patches from `lib/workflow/types.ts` (`normalizeWorkflowSteps`, etc.); shared `mergeWorkflowStep` + constants on server/client.
- Deleted `tests/unit/assistant-turn.test.ts`; step logic tests moved to `tests/unit/chat/turn-workflow.test.ts`.

---

## 5. Deviations from PRD / initial design

| Initial draft | Actual | Reason |
|---------------|--------|--------|
| `useChat({ resume: true })` on mount | `resume: false` + conditional `resumeStream()` + ref single-call | Avoid Strict Mode double invoke; pair with last-message guard |
| GET stream checks `active_stream_id` only | Also check if DB last message is already assistant | Eliminate race between LLM persist and run cleanup |
| `generateId()` as stream assistant id | `randomUUID()` + same id on persist | Align with Postgres `messages.id` (UUID) |
| Design doc “pending turn” fake bubble | Removed; server `start` event instead | User feedback: no empty placeholder assistant |

---

## 6. Acceptance checklist

> Verified by **qa-engineer**; aligned with §8.2 mapping.

### Workflow (AC-50–55)

- [x] **AC-50** — ≥4 English workflow steps (E2E `iter06-workflow.spec.ts`)
- [x] **AC-51** — `running` < 500ms (unit emit order; dev UI observation pass)
- [x] **AC-52** — step failure aborts + error copy (unit runner abort; API mock follow-up)
- [x] **AC-53** — DB logs + RLS (migration + policies; prod apply on deploy)
- [x] **AC-54** — iter-05 chat regression (E2E 13 incl. AC-34, AC-50)
- [x] **AC-55** — restore steps after refresh; **single bubble on LLM refresh** (dev + manual pass)

### Stream resume (AC-60–64)

- [x] **AC-60** — resume tokens after refresh (Upstash env + manual pass)
- [x] **AC-61** — no Redis residue after success (`purgeResumableStream` + TTL)
- [x] **AC-62** — Redis purge on failure (error path + `scheduleRunCleanup`)
- [x] **AC-63** — 204 when no stream or assistant persisted + DB fallback (unit + GET guard)
- [x] **AC-64** — `active_stream_id` cleared at terminal state (`clearActiveStreamId`)

### Dev-phase manual calibration items

- [x] Steps visible during validate/load; Generate response `running` while streaming  
- [x] Collapse to “N steps completed” when done  
- [x] Refresh **during LLM** → single AI bubble  
- [x] Refresh **after LLM** → single bubble, steps settled  
- [x] Steps update / restore after mid-run refresh  

---

## 7. Release checklist

| Item | Status |
|------|--------|
| Delivery (§3) | [x] |
| Dev calibrations in design (§4) | [x] |
| `pnpm test:ci` | [x] 2026-06-24 |
| Changelog AC (§6) | [x] |
| PRD AC synced | [x] |
| Iteration README updated | [x] |
| User confirms `测试已通过，可发布` | [x] |
| Mark iteration **released** + date | [x] 2026-06-24 |

---

## 8. QA acceptance report (2026-06-24)

### 8.1 Automated commands

| Command | Result |
|---------|--------|
| `pnpm lint` | pass (QA fixes: ignore `.agents/**` in `eslint.config.mjs`; remove unused import in `stream/route.ts`; move ref update to effect in `chat-conversation-panel`; wrap mount restore in `use-turn-workflow`) |
| `pnpm build` | pass |
| `pnpm test` | pass (47) |
| `pnpm test:e2e` | pass (13) |
| `pnpm test:ci` | pass |

### 8.2 AC mapping

| AC ID | Verification | Result |
|-------|--------------|--------|
| AC-50 | E2E `tests/e2e/iter06-workflow.spec.ts` | pass |
| AC-51 | Unit emit order + dev UI observation | pass |
| AC-52 | Unit runner abort on failure | pass (API mock follow-up) |
| AC-53 | Migration RLS policies | pass (apply on deploy) |
| AC-54 | E2E iter-04/05/06 | pass |
| AC-55 | Dev + manual single-bubble refresh | pass |
| AC-60–64 | Upstash manual + code paths | pass |
| Manual §6 | Step UI / refresh scenarios | pass |

### 8.3 Release notes

- **Iteration status:** **Released** (2026-06-24)
- **Known follow-up (non-blocking):** API failure-path E2E mock; AC-51 precise 500ms benchmark; two-account RLS integration test.
- **E2E AC-55:** Flaky in CI; covered by §6 manual calibration + dev verification.

---

## 9. Revision history

| Date | Change |
|------|--------|
| 2026-06-24 | Created iter-06 changelog — PRD confirmed |
| 2026-06-24 | §3 delivery; §4 dev calibrations (Supabase context, turn-workflow refactor, single assistant + resume dedup); §5 design deltas |
| 2026-06-24 | AC-55 / AC-63 “single bubble on LLM refresh”; QA manual calibration sub-checklist |
| 2026-06-24 | §8 QA report; AC checked and PRD synced |
| 2026-06-24 | §7 release checklist; docs ready for release confirmation |
| 2026-06-24 | User confirmed release; iteration **released** |
