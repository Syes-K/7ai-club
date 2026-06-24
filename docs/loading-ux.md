# Loading UX — Global Convention

> **English:** [loading-ux.md](./loading-ux.md)  
> **中文:** [loading-ux-cn.md](./loading-ux-cn.md)

> **Scope:** All user-visible async operations (Console, Chat, Auth).  
> **Status:** iter-05 established · iter-05 audit expanded  
> **Locale:** User-facing loading labels are **English**.

---

## 1. Principles

1. **Lock the operation scope** — While a mutation runs, disable other actions in the same scope to prevent races and double submits.
2. **Never action-only for mutations** — A single button showing `Saving…` while siblings stay clickable is **not** sufficient for list pages or multi-action surfaces.
3. **Match data-fetch pattern** — RSC-first routes use `loading.tsx`; client-first lists use `usePageBusy` on mount.
4. **Layer feedback** — Overlay/scope lock for the surface **plus** dialog/button copy where a modal is open.
5. **One in-flight mutation per scope** — Page, section, or chat shell region at a time.

---

## 2. Loading levels

| Level | When | Mechanism | Example |
|-------|------|-----------|---------|
| **A. Route initial (RSC)** | Server page awaits DB/API before first paint | `app/<route>/loading.tsx` + `ConsolePageLoading` | `/console/models`, `/console/profile` |
| **B. Route initial (client)** | Page mounts empty then fetches | `usePageBusy("Loading …")` on mount | `/console/assistants` |
| **C. Page / panel busy** | List CRUD, tests, deletes on a full page or chat main panel | Overlay + `pointer-events-none` on content | Models mutations; Chat delete / nav |
| **D. Section busy** | Independent save blocks on one route | `ConsoleSection` overlay per card | Profile Account / Preferences |
| **E. Inline / list item** | Secondary indicator within an already-busy scope | Spinner on row, sidebar item `Loading…` | Chat sidebar during conversation switch |
| **F. Dialog / button only** | **Supplement only** — not alone for C/D scopes | `Saving…`, `Deleting…`, `Clearing…` on modal buttons | Form dialogs under page busy |
| **G. Stream / status** | Long-running AI response | Framework status + disabled input | `useChat` + `Thinking…` |
| **H. Global** | Full-app teardown | Menu item disabled + label | Sign out `Signing out…` |

**Do not use** full-app overlay for Console mutations — too heavy.

---

## 3. Decision tree (new action)

```
Is it the first paint of a route?
├─ Yes, data from RSC (page.tsx async)
│   └─ Add app/<segment>/loading.tsx (Level A)
├─ Yes, data from client useEffect on mount
│   └─ usePageBusy on mount (Level B)
└─ No — user triggered async
    ├─ Console list page with row + header actions?
    │   └─ ConsolePage + runBusy (Level C) + dialog button copy (F)
    ├─ Console multi-card form page?
    │   └─ ConsoleSection per card (Level D) + button copy (F)
    ├─ Chat main panel (delete, switch conversation, clear)?
    │   └─ ChatNavigationFeedback or equivalent panel overlay (Level C)
    ├─ Chat sidebar list fetch?
    │   └─ listLoading inline (Level E)
    ├─ Chat send / stream?
    │   └─ useChat status (Level G)
    ├─ Auth form submit?
    │   └─ Button disabled + Please wait… (F)
    └─ Sign out / session end?
        └─ Menu disabled + Signing out… (H)
```

---

## 4. Console

**Full detail:** [features/console/design/console-shell.md](./features/console/design/console-shell.md) §8.

### 4.1 Components

| Component | Role |
|-----------|------|
| `ConsolePage` | `busy` / `busyLabel` — page-level overlay |
| `ConsoleSection` | Card-level overlay |
| `ConsoleBusyOverlay` | Shared spinner + label |
| `ConsolePageLoading` | RSC `loading.tsx` skeleton |
| `usePageBusy` | `runBusy(label, asyncFn)` state helper |

### 4.2 Rules

- Header CTA disabled when `busy`.
- Table actions disabled when `busy`; guard `if (busy) return` before opening dialogs.
- Wrap **API call + list refresh** in one `runBusy` call.
- Dialog open during mutation: page stays busy underneath; dialog shows `Saving…` / `Deleting…`.

### 4.3 Initial load by route

| Route | Pattern |
|-------|---------|
| `/console/models` | RSC → `models/loading.tsx` (A) |
| `/console/profile` | RSC → `profile/loading.tsx` (A) |
| `/console/assistants` | Client → `runBusy("Loading assistants…")` (B) |

New list pages: prefer **B** (consistent overlay) or **A** if RSC-only — never leave first paint without A or B.

---

## 5. Chat

**Shell detail:** [features/console/design/chat-integration.md](./features/console/design/chat-integration.md).

### 5.1 Components

| Component | Role |
|-----------|------|
| `ChatNavigationFeedback` | Main panel overlay — `loading` / `slow` / `timeout` / **`deleting`** |
| `ChatSidebar` | `listLoading`, `pendingId` row spinner |
| `ChatAppShell` | `deletingId`, `pendingId`, `listLoading` orchestration |
| `AssistantPickerDialog` | `Loading assistants…` on open |
| `ClearChatDialog` | `Clearing…` on button (F); panel overlay optional future |

### 5.2 Rules

- **Switch conversation:** `pendingId` + sidebar `Loading…` + `ChatNavigationFeedback` (C + E).
- **Delete conversation:** `deletingId` → panel `deleting` phase; disable sidebar nav; dialog `Deleting…` (C + F). Clear `deletingId` before `loadConversation` when switching to next chat.
- **Sidebar first load:** `listLoading` — show `Loading conversations…`, not empty state (E).
- **New chat:** `creating` on buttons (F).
- **Send message:** input disabled when not `ready`; `Thinking…` (G).

---

## 6. Auth

| Action | Pattern |
|--------|---------|
| Login / Register | `AuthForm` — `Please wait…`, disabled submit (F) |
| Sign out | `UserMenu` — `Signing out…`, disabled menuitem (H) |

---

## 7. Copy conventions

| Context | Label examples |
|---------|----------------|
| Console page load | `Loading models…`, `Loading profile…`, `Loading assistants…` |
| Console mutation | `Adding model…`, `Testing model…`, `Deleting model…`, `Saving account…` |
| Chat navigation | `Loading conversation…`, `Still loading…`, `Deleting conversation…` |
| Chat lists | `Loading conversations…`, `Loading assistants…` |
| Dialogs | `Saving…`, `Deleting…`, `Clearing…`, `Creating…` |
| Auth | `Please wait…`, `Signing out…` |

Use **verb + ellipsis** (`…`). Keep labels specific to the operation.

---

## 8. Accessibility

- Overlays: `aria-busy="true"`, `role="status"`, `aria-live="polite"`.
- Disable interactive elements in locked scope, not only hide them.
- Do not rely on color alone — include spinner or text.

---

## 9. Anti-patterns

| Avoid | Why |
|-------|-----|
| Only `Testing…` on one button while other row actions work | Race conditions |
| Empty state before client list fetch completes | Flash “No items” |
| Delete with dialog button only, no panel lock | User can interact with stale conversation |
| `runBusy` without disabling header CTA | Duplicate creates |
| Multiple concurrent `runBusy` on same page | Undefined UI state |

---

## 10. Checklist (new async action)

- [ ] Classified level (A–H) using §3
- [ ] Scope locked (page / section / panel / button)
- [ ] English label chosen (§7)
- [ ] `aria-busy` on overlay if applicable
- [ ] Error path clears busy state (`finally` / `catch`)
- [ ] Documented in feature `design/` if new surface (one-line ref to this doc)

---

## 11. Adoption matrix (iter-05)

| Surface | Initial load | Mutations |
|---------|--------------|-----------|
| Console Models | `loading.tsx` (A) | `runBusy` (C) |
| Console Profile | `loading.tsx` (A) | `ConsoleSection` (D) |
| Console Assistants | `runBusy` (B) | `runBusy` (C) |
| Chat sidebar | `listLoading` (E) | — |
| Chat switch conv | — | `ChatNavigationFeedback` (C) |
| Chat delete | — | `deleting` phase (C) + dialog (F) |
| Chat clear | — | dialog (F) only* |
| Chat send | — | `useChat` (G) |
| Auth | — | button (F) / sign out (H) |

\*Clear chat: dialog sufficient for MVP; panel overlay optional for parity with delete.

---

## 12. Revision history

| Date | Change |
|------|--------|
| 2026-06-17 | Global convention — iter-05 audit, Console + Chat + Auth |
