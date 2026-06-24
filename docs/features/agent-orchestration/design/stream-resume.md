# Stream resume & Upstash — Technical design

> **English:** [stream-resume.md](./stream-resume.md)  
> **中文:** [stream-resume-cn.md](./stream-resume-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/stream-resume.md](../prd/stream-resume.md)  
> **Iteration:** iter-06

---

## 1. Goals

- Resume in-flight SSE after browser refresh  
- Purge all Upstash keys for a run on completed / error / cancelled  
- Do not cancel LLM via `req.signal` on refresh  
- Redis stores SSE chunks only — no API keys or full message bodies

---

## 2. Integration

- Packages: `resumable-stream`, `@upstash/redis`  
- Env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`  
- POST: `consumeSseStream` + `createNewResumableStream`  
- GET: `/api/chat/[conversationId]/stream` → `resumeExistingStream` or 204  
- Client: `useChat({ resume: true })`

See [stream-resume-cn.md](./stream-resume-cn.md) for purge triggers, TTL fallback, and file list.

---

## 3. Revision history

| Date | Change |
|------|--------|
| 2026-06-24 | iter-06 technical design draft |
