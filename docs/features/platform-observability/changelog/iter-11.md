# iter-11 changelog — Vercel Analytics

> **English:** [iter-11.md](./iter-11.md)  
> **中文:** [iter-11-cn.md](./iter-11-cn.md)  
> **Iteration index:** [iter-11/README.md](../../iterations/iter-11/README.md)

---

## 1. Theme

| Topic | PRD | Design |
|-------|-----|--------|
| Vercel Analytics + Speed Insights | [prd/vercel-analytics.md](../prd/vercel-analytics.md) | [design/vercel-analytics.md](../design/vercel-analytics.md) |

---

## 5. Acceptance checklist

> **Checkbox rule:** qa-engineer only, after Phase C4 pass.

### Summary

- [x] **AC-111** — Web Analytics page views in Vercel Dashboard (prod)
- [x] **AC-112** — Speed Insights Web Vitals sample visible
- [x] **AC-113** — `sign_up_complete` on successful registration
- [x] **AC-114** — `sign_in_complete` on successful login
- [x] **AC-115** — `conversation_started` on new conversation
- [x] **AC-116** — Reported URLs have no query string
- [x] **AC-117** — `pnpm build` passes; no hydration errors
- [x] **AC-118** — Local dev does not send analytics traffic

### 5.1 Test Matrix (qa-engineer · Phase C0)

| AC ID | Verification | Automation | Evidence |
|-------|--------------|------------|----------|
| AC-111 | static + manual | `integration.test.ts` | 3 cases pass; build OK; M-02 dashboard post-deploy |
| AC-112 | static + manual | `integration.test.ts` | SpeedInsights wired; M-03 dashboard post-deploy |
| AC-113 | unit + manual | `integration.test.ts` | auth-form signUpComplete wiring |
| AC-114 | unit + manual | `integration.test.ts`, `events.test.ts` | signInComplete + Vercel prod track mock |
| AC-115 | unit | `integration.test.ts` | chat-app-shell conversationStarted |
| AC-116 | unit | `before-send.test.ts` | 4 passed |
| AC-117 | static | CI | 2026-07-03 build OK |
| AC-118 | unit | `events.test.ts` | 3 passed; dev noop |

---

## 6. Gate & phase status

| Phase | Status | Date |
|-------|--------|------|
| Test C0–C3 | Pass | 2026-07-03 |
| Release | **Released** (user · 2026-07-03) | 2026-07-03 |

---

## 12. Manual script — C2 summary (2026-07-03)

```bash
pnpm lint          # pass
pnpm build         # pass
pnpm test          # 139 passed
CI=1 pnpm test:e2e # 24 passed, 1 flaky iter04 (non-blocking)
```

See [iter-11-cn.md](./iter-11-cn.md) §12 for full M-xx table.

---

## 13. Revision history

| Date | Change |
|------|--------|
| 2026-07-02 | Created iter-11 changelog |
| 2026-07-03 | User confirmed release |
