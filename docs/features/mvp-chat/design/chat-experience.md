# Chat Experience — Technical Design

> **English:** [chat-experience.md](./chat-experience.md)  
> **中文：** [chat-experience-cn.md](./chat-experience-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/chat-experience.md](../prd/chat-experience.md)  
> **Iteration:** iter-02  
> **Status:** Draft  
> **Version:** v0.2

---

## 1. Goals

- `DELETE /api/conversations/[id]` — delete conversation
- `DELETE /api/conversations/[id]/messages` — clear chat history
- Markdown via `react-markdown` + sanitize; system_prompt migration
- Chat sub-header: assistant title left-aligned; **Clear chat** on the right

Full detail: [chat-experience-cn.md](./chat-experience-cn.md).

---

## 2. Key APIs & Files

| Item | Path |
|------|------|
| DELETE conversation | `app/api/conversations/[id]/route.ts` |
| DELETE messages (clear) | `app/api/conversations/[id]/messages/route.ts` |
| RLS migration | `supabase/migrations/20260616000000_messages_delete_own.sql` |
| Prompt migration | `supabase/migrations/20260615000000_iter02_assistant_markdown_prompt.sql` |
| Clear dialog | `components/chat/clear-chat-dialog.tsx` |
| MD component | `components/chat/markdown-content.tsx` |

---

## 10. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-06-15 | v0.1 | iter-02 initial |
| 2026-06-16 | v0.2 | F-14 clear chat; sub-header layout |
