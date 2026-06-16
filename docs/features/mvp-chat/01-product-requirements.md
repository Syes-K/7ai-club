# MVP Chat — Product Requirements (Index)

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `mvp-chat`  
> **Roadmap phase:** 1 — MVP Chat  
> **Status:** Confirmed  
> **PRD confirmed date:** 2026-06-15  
> **Document version:** v0.3 (layered structure)

---

## 1. Executive Summary

Phase 1 chat: email auth, streaming conversations, Supabase RLS persistence, multi-LLM via env. iter-02 adds marketing home, chat UX (delete, Markdown, header user), C2 visual unity. **User-facing UI: English.**

Details live in topic PRDs — see [§3 Document map](#3-document-map). **Agents: read only relevant topic docs + [iter-02 changelog](./changelog/iter-02.md) for the current iteration.**

---

## 2. Global Conventions

### 2.1 Routes

| Path | Page | Auth |
|------|------|------|
| `/` | Marketing home | Public |
| `/login` | Sign-in | Public |
| `/register` | Register | Public |
| `/chat` | Chat entry | Required |
| `/chat/[conversationId]` | Conversation | Required |

### 2.2 Permissions

| Action | Who |
|--------|-----|
| View `/` | Anyone |
| Chat / view conversations | Signed-in (RLS) |
| Delete conversation | Owner |
| LLM API keys | Server only |

### 2.3 Out of Scope (feature-wide)

Assistant CRUD UI, RAG, MCP, in-app model switcher, OAuth, soft delete, Console page (iter-02).

### 2.4 Feature Index

| ID | Topic | PRD | Iteration |
|----|-------|-----|-----------|
| F-01–F-08 | Auth, stream, history | [prd/core-chat.md](./prd/core-chat.md) | iter-01 |
| F-09 | Default assistant prompt | [prd/chat-experience.md](./prd/chat-experience.md) | iter-02 |
| F-10–F-11 | Landing, header, C2 | [prd/landing.md](./prd/landing.md) | iter-02 |
| F-12–F-13 | Delete, Markdown | [prd/chat-experience.md](./prd/chat-experience.md) | iter-02 |
| F-14–F-15 | Providers, Bailian stability | [prd/llm-reliability.md](./prd/llm-reliability.md) | iter-01/02 |

---

## 3. Document Map

| Doc | Scope |
|-----|-------|
| [prd/core-chat.md](./prd/core-chat.md) | iter-01 core |
| [prd/landing.md](./prd/landing.md) | Home, C2 visual |
| [prd/chat-experience.md](./prd/chat-experience.md) | Delete, MD |
| [prd/llm-reliability.md](./prd/llm-reliability.md) | LLM providers, errors |
| [changelog/iter-02.md](./changelog/iter-02.md) | iter-02 delta, AC-10–20 |

Technical index: [02-technical-design.md](./02-technical-design.md) · iter-01 detail: [design/core-chat.md](./design/core-chat.md)

---

## 6. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-06-14 | v0.1 | iter-01 monolithic PRD |
| 2026-06-15 | v0.2 | iter-02 in single file |
| 2026-06-15 | v0.3 | **Layered:** index + `prd/` + `changelog/` |

---

*Overview: [README.md](./README.md)* · *Iteration: [iter-02](../../iterations/iter-02/README.md)*
