# Stream resume & Upstash Redis

> **English:** [stream-resume.md](./stream-resume.md)  
> **中文:** [stream-resume-cn.md](./stream-resume-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-06  
> **Related:** [workflow-orchestration.md](./workflow-orchestration.md)

---

## 1. Scope

F-53 — **Upstash Redis** + Vercel AI SDK **Resumable Stream** to resume in-flight tokens after browser refresh; **purge Redis data for that run** after successful completion or on error.

---

## 2. User stories

| ID | Story | Priority |
|----|-------|----------|
| US-55 | As a user, if I refresh while the AI is replying, I continue seeing text and receive further tokens | P0 |
| US-56 | As a user, refresh alone should not cancel generation (distinct from Stop, if shipped) | P1 |
| US-57 | As the platform, no Redis buffer should remain after each run ends | P0 |

---

## 3. F-53 Requirements

### 3.1 Upstash

- Provider: **Upstash** Serverless Redis  
- Purpose: buffer active SSE / resumable stream chunks only  
- Env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (names may be finalized in technical design)

### 3.2 Resumable stream flow

1. POST creates resumable stream + `activeStreamId` on `workflow_runs`  
2. Chunks written to Upstash during stream  
3. GET resume endpoint calls `resumeExistingStream`  
4. `useChat({ resume: true })` on mount  
5. 204 when no active stream  

### 3.3 Refresh vs cancel

| Action | Expected |
|--------|----------|
| Browser refresh | Run continues; client resumes |
| User Stop (if implemented) | Cancel run; purge Redis |
| Completed / error | Purge Redis; clear `active_stream_id` |

Refresh must **not** be the sole mechanism that aborts the LLM run.

### 3.4 Redis cleanup (required)

**After each run completes or errors, delete all Upstash keys for that run.**

Triggers: `completed`, `error`, `cancelled`, stream `onEnd`/`onFinish`.

- Run ASAP (may use `after()`)  
- Log and retry on cleanup failure; **TTL fallback** recommended (e.g. 30–60 min)  
- No API keys or full message bodies in Redis values  

### 3.5 Acceptance criteria

- [x] **AC-60** — Refresh during stream resumes tokens  
- [x] **AC-61** — No leftover keys after successful run  
- [x] **AC-62** — Same purge on error  
- [x] **AC-63** — 204 resume + DB fallback UI  
- [x] **AC-64** — `active_stream_id` cleared at terminal state  

---

## 4. Revision history

| Date | Change |
|------|--------|
| 2026-06-24 | iter-06 initial — PRD confirmed; Upstash + post-run Redis purge |
| 2026-06-24 | AC-60–64 verified; synced with changelog §6 |
