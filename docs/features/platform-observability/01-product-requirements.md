# Platform Observability — Product Requirements (Overview)

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文:** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `platform-observability`  
> **Iteration:** `iter-11` (see [iter-11/README.md](../../iterations/iter-11/README.md))  
> **Roadmap phase:** 5 — Production (observability foundation)  
> **Status:** Confirmed  
> **PRD confirmed:** 2026-07-02  
> **Doc version:** v0.1

---

## 1. Executive summary

Integrate **Vercel Web Analytics** and **Speed Insights** so deployed environments collect page views and Core Web Vitals automatically, plus a small set of custom product events (sign-up, sign-in, conversation started). No user-facing UI changes; data is viewed in the Vercel Dashboard. This iteration is infrastructure only—not a replacement for Langfuse / Axiom agent tracing.

---

## 2. Background & goals

### 2.1 Background

- The app deploys on Vercel; architecture reference lists observability as an open decision.
- There is no page-level traffic or frontend performance telemetry today.
- Vercel Analytics / Speed Insights are cookieless and anonymized, aligned with MVP privacy expectations.

### 2.2 Goals

- Automatic page views and Web Vitals in production.
- Three custom events for funnel analysis (register → login → chat).
- Strip query strings from reported URLs via `beforeSend`.

### 2.3 Out of scope

- Langfuse / Axiom / OpenTelemetry backend or agent tracing
- In-app analytics dashboard
- Cookie consent banner (Vercel Analytics is cookieless; GA etc. is a future iteration)
- A/B tests or feature-flag analytics integration
- Guaranteed collection on non-Vercel/self-hosted deployments

---

## 3. Users & scenarios

| Role | Need |
|------|------|
| Product / ops | Traffic, top routes, funnel in Vercel Dashboard |
| Engineering | LCP, INP, CLS in Speed Insights |
| End users | No visible change |

### User stories

| ID | Story | Priority |
|----|-------|----------|
| US-01 | Page views in Vercel for Landing/auth funnel | P0 |
| US-02 | Core Web Vitals in Speed Insights | P0 |
| US-03 | Custom events for sign-up and conversation start | P0 |

---

## 4. Functional requirements (summary)

| ID | Feature | Priority |
|----|---------|----------|
| F-01 | Web Analytics (`@vercel/analytics`) | P0 |
| F-02 | Speed Insights (`@vercel/speed-insights`) | P0 |
| F-03 | URL redaction (`beforeSend` strips query) | P0 |
| F-04 | Events: `sign_up_complete`, `sign_in_complete`, `conversation_started` | P0 |
| F-05 | Prod-only reporting; local dev noop | P0 |
| F-06 | Dashboard enablement runbook in docs | P1 |

Details: [prd/vercel-analytics.md](./prd/vercel-analytics.md).

---

## 5. Pages & interaction

No user-visible UI. Integration in root layout and a few client success hooks.

| Path | Tracking |
|------|----------|
| `/` | Auto page view |
| `/login`, `/register` | Page view + success event |
| `/chat`, `/chat/[id]` | Page view + `conversation_started` on new conversation |
| `/console/**` | Auto page view |

---

## 6. Permissions & security (product)

| Action | Who |
|--------|-----|
| View analytics | Vercel project members |
| Trigger events | All visitors (anonymous) |
| Event payload | No PII (email, user id, message content) |

---

## 7. Non-functional

| Type | Requirement |
|------|-------------|
| Performance | Scripts load async; no blocking UX |
| Privacy | Anonymized; query stripped from URLs |
| Reliability | Telemetry failure must not break auth/chat |

---

## 8. Acceptance criteria

- [ ] AC-01: Page views visible in Vercel Web Analytics (incl. `/`, `/login`, `/chat`) after prod deploy
- [ ] AC-02: Web Vitals sample in Speed Insights (within 24h or verified on staging)
- [ ] AC-03: `sign_up_complete` after successful registration
- [ ] AC-04: `sign_in_complete` after successful login
- [ ] AC-05: `conversation_started` after new conversation from assistant picker
- [ ] AC-06: Reported URLs have no query string
- [ ] AC-07: `pnpm build` passes; no SSR/hydration errors from Analytics components
- [ ] AC-08: Local `pnpm dev` does not send to production endpoints (or debug-only)

---

## 9. Dependencies & assumptions

- Deployed on Vercel with correct project linkage
- Web Analytics and Speed Insights enabled in Vercel Dashboard
- E2E does not assert cloud dashboard data (build + manual/debug verification)

---

## 10. Open questions

| ID | Question | Status | Decision |
|----|----------|--------|----------|
| OQ-01 | Include Speed Insights | Resolved | Yes |
| OQ-02 | Custom event scope | Resolved | Three basic events |
| OQ-03 | Exclude /console or /chat paths | Resolved | No; full site + query redaction |
| OQ-04 | Auth event dimensions (e.g. `method`) | Open | Event name only, no payload |

---

## 11. Doc map

| Topic | PRD | Design |
|-------|-----|--------|
| Vercel Analytics + Speed Insights | [prd/vercel-analytics.md](./prd/vercel-analytics.md) | TBD (fullstack-developer) |

**Changelog:** [changelog/iter-11.md](./changelog/iter-11.md)

---

## 12. Revision history

| Date | Version | Iteration | Change |
|------|---------|-----------|--------|
| 2026-07-02 | v0.1 | iter-11 | Initial draft |
