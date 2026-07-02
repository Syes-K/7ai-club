# Vercel Analytics & Speed Insights

> **English:** [vercel-analytics.md](./vercel-analytics.md)  
> **中文:** [vercel-analytics-cn.md](./vercel-analytics-cn.md)

> **Feature:** `platform-observability`  
> **Iteration:** `iter-11`  
> **Priority:** P0

---

## 1. Description

Integrate official Vercel npm packages in the Next.js App Router root layout for automatic page views, Core Web Vitals, and a small set of custom `track()` events at key product moments.

---

## 2. Packages & components

| Package | Component | Location |
|---------|-----------|----------|
| `@vercel/analytics` | `<Analytics />` from `@vercel/analytics/next` | `app/layout.tsx` |
| `@vercel/speed-insights` | `<SpeedInsights />` from `@vercel/speed-insights/next` | `app/layout.tsx` |

Place both after `{children}` inside `<body>`, per Vercel quickstart.

---

## 3. URL redaction (beforeSend)

**Rule:** Strip query strings from `event.url` before send.

| Actual URL | Reported URL |
|------------|--------------|
| `/login?next=%2Fchat` | `/login` |
| `/chat/abc-123?assistant=xyz` | `/chat/abc-123` |

**Constraints:**

- Parse pathname; drop search/hash
- Do not filter paths like `/console` or `/chat`
- On parse failure, drop event (`return null`)

---

## 4. Custom events

Use `track(eventName)` only—no PII in payloads.

| Event | Trigger | Planned location |
|-------|---------|------------------|
| `sign_up_complete` | Successful Supabase `signUp` | `components/auth/auth-form.tsx` |
| `sign_in_complete` | Successful `signInWithPassword` | `components/auth/auth-form.tsx` |
| `conversation_started` | Successful `createConversation` | `components/chat/chat-app-shell.tsx` |

**Not tracked:** failed auth, per-message chat, Console CRUD.

---

## 5. Environment behavior

| Environment | Behavior |
|-------------|----------|
| Vercel Production | Full reporting |
| Vercel Preview | Full reporting |
| `pnpm dev` | No network requests; noop `track()` |
| Local `next start` without `VERCEL` | Same as dev |

---

## 6. Vercel Dashboard (ops)

After code merge:

1. Enable Web Analytics in project settings
2. Enable Speed Insights
3. Deploy to Production
4. Verify data in dashboard (manual)

---

## 7. Edge cases

| Case | Expected |
|------|----------|
| Script load failure | Core app unaffected |
| `track()` on server | Forbidden—client success hooks only |
| Sign-up success without confirmed email | Still fire `sign_up_complete` |

---

## 8. Acceptance (this doc)

- [ ] AC-101: Root layout has Analytics + SpeedInsights with `beforeSend`
- [ ] AC-102: Three `track()` call sites as specified
- [ ] AC-103: Unit test for URL redaction helper
- [ ] AC-104: Dev does not send analytics requests

---

## 9. Revision history

| Date | Change |
|------|--------|
| 2026-07-02 | iter-11 initial |
