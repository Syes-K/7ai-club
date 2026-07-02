# Platform Observability — Technical Design (Overview)

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文:** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `platform-observability`  
> **Iteration:** `iter-11`  
> **Roadmap phase:** 5 — Production (observability foundation)  
> **PRD:** [01-product-requirements.md](./01-product-requirements.md)  
> **Status:** Confirmed  
> **Design confirmed:** 2026-07-02  
> **Doc version:** v0.1

---

## 1. Overview

### 1.1 Design goals

- Mount Vercel Web Analytics + Speed Insights once at the app root
- Strip query strings from page-view URLs before send
- Fire three client-side custom events at existing success hooks
- No DB/API changes; telemetry failure must not affect core flows

### 1.2 Architecture alignment

| Item | Choice |
|------|--------|
| Deployment | Vercel (existing) |
| Integration point | Root layout + 2 existing Client Components |
| Data store | None (Vercel Dashboard only) |
| Auth / RLS | Unchanged |
| User UI | No visible change |

---

## 2. Doc map

| Topic | Design doc |
|-------|------------|
| Vercel Analytics + Speed Insights | [design/vercel-analytics.md](./design/vercel-analytics.md) |

**Changelog:** [changelog/iter-11.md](./changelog/iter-11.md)

---

## 3. Database

**No changes.** No migrations, tables, or RLS for iter-11.

---

## 4. API

**No changes.** No new Route Handlers. Custom events use client-side `track()`.

---

## 5. Flow (summary)

```mermaid
flowchart LR
  subgraph client [Browser]
    PV[Page navigation] --> A[@vercel/analytics]
    BS[beforeSend redact] --> A
    Auth[AuthForm success] --> T[trackProductEvent]
    Chat[createConversation ok] --> T
    T --> A
    SI[@vercel/speed-insights] --> V[Vercel ingest]
    A --> V
  end
  V --> D[Vercel Dashboard]
```

---

## 6. Pages & routes

No route changes. All existing routes automatically emit page views once `<Analytics />` is mounted.

| Route group | Page views | Custom events |
|-------------|------------|---------------|
| `/`, `/login`, `/register` | Auto | Auth success |
| `/chat`, `/chat/[id]` | Auto | `conversation_started` on new conversation |
| `/console/**` | Auto | — |

---

## 7. Component summary

| Component | Type | Role |
|-----------|------|------|
| `VercelObservability` | Client | Wraps `<Analytics beforeSend={...} />` + `<SpeedInsights />` |
| `AuthForm` | Client (existing) | +2 `trackProductEvent` calls |
| `ChatAppShell` | Client (existing) | +1 `trackProductEvent` call |

Detail: [design/vercel-analytics.md](./design/vercel-analytics.md).

---

## 8. lib modules

| Path | Role |
|------|------|
| `lib/analytics/before-send.ts` | Pure `redactAnalyticsEventUrl` for `beforeSend` |
| `lib/analytics/events.ts` | Event name constants + `trackProductEvent()` guard |
| `lib/analytics/index.ts` | Re-exports |

---

## 9. File change list

| Action | Path | Notes |
|--------|------|-------|
| Add | `package.json` | `@vercel/analytics`, `@vercel/speed-insights` |
| Add | `lib/analytics/before-send.ts` | URL redaction |
| Add | `lib/analytics/events.ts` | Event wrapper |
| Add | `lib/analytics/index.ts` | Barrel |
| Add | `components/analytics/vercel-observability.tsx` | Client bundle |
| Modify | `app/layout.tsx` | Mount `<VercelObservability />` |
| Modify | `components/auth/auth-form.tsx` | Auth events |
| Modify | `components/chat/chat-app-shell.tsx` | Conversation event |
| Add | `tests/unit/analytics/before-send.test.ts` | Unit tests |
| Add | `tests/unit/analytics/events.test.ts` | noop guard tests |
| Add | `docs/features/platform-observability/design/vercel-analytics*.md` | Module design |

**No changes:** Supabase, API routes, middleware, env vars (Vercel auto-detects deployment).

---

## 10. Security & degradation

| Risk | Mitigation |
|------|------------|
| Query params leak (`?next=`) | `beforeSend` strips search/hash |
| PII in custom events | Event name only; no payload |
| Analytics script failure | No try/catch UI; core flows unchanged |
| Dev noise in dashboard | Package + wrapper noop outside production Vercel deploy |
| RSC → Client function prop | `beforeSend` lives inside Client Component wrapper |

---

## 11. Test plan

### 11.1 Automation

| Type | Path | Coverage |
|------|------|----------|
| Unit | `tests/unit/analytics/before-send.test.ts` | AC-116 URL redaction |
| Unit | `tests/unit/analytics/events.test.ts` | AC-118 dev noop |
| Static | `pnpm build` | AC-117 layout + deps |
| E2E | `tests/e2e/smoke.spec.ts` | Regression only (no cloud assert) |

### 11.2 Manual QA

- Vercel Dashboard: page views, events, Speed Insights (changelog §12)
- Preview deploy + `debug` prop optional for event verification

### 11.3 Local verification

```bash
pnpm lint && pnpm build && pnpm test && CI=1 pnpm test:e2e
```

### 11.4 Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| — | No | Vercel injects deployment context; no new `.env` keys |

**Ops (manual):** Enable Web Analytics + Speed Insights in Vercel project Settings.

---

## 12. PRD acceptance mapping (required)

| AC ID | Implementation | Verification |
|-------|----------------|--------------|
| AC-111 | `<Analytics />` in root via `VercelObservability` | manual — Vercel Dashboard after prod deploy |
| AC-112 | `<SpeedInsights />` in same wrapper | manual — Speed Insights dashboard |
| AC-113 | `trackProductEvent('sign_up_complete')` after successful `signUp` (incl. email-confirm path) | manual / preview debug |
| AC-114 | `trackProductEvent('sign_in_complete')` after successful `signInWithPassword` | manual / preview debug |
| AC-115 | `trackProductEvent('conversation_started')` after `createConversation` returns id | manual / preview debug |
| AC-116 | `redactAnalyticsEventUrl` in `beforeSend` | unit + manual |
| AC-117 | Valid imports; build passes | static — `pnpm build` |
| AC-118 | `trackProductEvent` noops when `!isAnalyticsEnabled()` | unit; manual Network tab in dev |

---

## 13. Open questions / tech debt

| ID | Question | Decision |
|----|----------|----------|
| TD-01 | Preview deployments pollute prod analytics | Accept for iter-11; filter by deployment in Dashboard |
| TD-02 | Langfuse for agent tracing | Future feature; out of iter-11 |
| TD-03 | `debug` prop on preview only | Optional qa manual step; not shipped to prod layout |

---

## 14. Revision history

| Date | Version | Iteration | Change |
|------|---------|-----------|--------|
| 2026-07-02 | v0.1 | iter-11 | Initial design |

---

*Next:* Phase B coding after user confirms: `技术设计已确认，可开始编码`
