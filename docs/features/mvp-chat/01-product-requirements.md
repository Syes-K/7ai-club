# MVP Chat

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `mvp-chat`  
> **Iteration:** `iter-01` (see [docs/iterations/iter-01/README.md](../../iterations/iter-01/README.md))  
> **Roadmap phase:** 1 — MVP Chat  
> **Status:** Confirmed  
> **PRD confirmed date:** 2026-06-14  
> **Document version:** v0.1

---

## 1. Executive Summary

Deliver a single-page streaming AI chat experience for signed-in users: one fixed default assistant (no assistant management UI), calling `Qwen/Qwen2.5-7B-Instruct` via SiliconFlow (OpenAI-compatible API), with conversations persisted in Supabase. Users can register and sign in with email, start new conversations, view history, and continue chatting. Visual style: Minimal + Professional + Dark. This feature is the foundational delivery for roadmap phase 1; later iterations extend assistant configuration, knowledge base, and MCP on top of it.

---

## 2. Background & Goals

### 2.1 Background

7ai-club is a chat-first web platform for configurable AI assistants. The repository currently contains architecture research and development workflow only, with no application code yet. iter-01 validates the tech stack (Next.js + Supabase Auth + Vercel AI SDK) and core product experience through a minimal viable chat loop.

### 2.2 Goals

- Signed-in users can register, sign in, and use streaming AI chat in the browser
- Conversations and messages are persisted; users can view a conversation history list and continue chatting
- User data is isolated via Supabase RLS; unauthenticated users cannot access chat features
- Establish Auth, data model, and chat API foundations for phase 2 (knowledge base) and phase 3 (Agent)

### 2.3 Out of Scope

- Assistant CRUD, custom system prompt UI
- Knowledge base / RAG, MCP tools, Agent multi-step reasoning (ToolLoopAgent)
- Multiple LLM providers or model-switching UI
- Magic Link, OAuth social login
- Rate limiting, observability, production-grade degradation (phase 5)
- Organization / multi-tenant model

---

## 3. Users & Scenarios

### 3.1 Target Users

| Role | Description |
|------|-------------|
| New user | First-time visitor who must register before using chat |
| Signed-in user | Daily AI chat user who manages multiple conversation histories |

### 3.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a new user, I want to register and sign in with email and password, so that I can use chat | P0 |
| US-02 | As a signed-in user, I want to send messages on the chat page and see AI replies stream in real time, so that the conversation feels natural and fluid | P0 |
| US-03 | As a signed-in user, I want to view my conversation history and open one to continue chatting, so that I can review and extend prior discussions | P0 |
| US-04 | As a signed-in user, I want to start a new blank conversation, so that I can begin a new topic | P0 |
| US-05 | As a signed-in user, I want to sign out, so that I can exit securely | P1 |

---

## 4. Functional Requirements

### 4.1 Feature List

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F-01 | User registration | Email + password registration; auto sign-in on success | P0 |
| F-02 | User sign-in | Email + password sign-in | P0 |
| F-03 | User sign-out | Clear session; redirect to sign-in page | P1 |
| F-04 | Route protection | Redirect unauthenticated users to sign-in when accessing protected pages | P0 |
| F-05 | Streaming chat | Send user messages; AI returns token-by-token stream | P0 |
| F-06 | Conversation persistence | Persist user messages and AI replies to the database | P0 |
| F-07 | Conversation history list | Sidebar shows the current user's conversations, sorted by recent activity | P0 |
| F-08 | New conversation | Create a blank conversation and switch to it | P0 |
| F-09 | Default assistant | One fixed assistant; system prompt configured server-side / via seed | P0 |

### 4.2 Details

#### F-05: Streaming Chat

**Description:** After the user sends a message in the input box, the UI displays the AI reply as a live token stream without waiting for the full response to finish.

**Interaction / rules:**

- Disable duplicate submission while sending (or show a loading state)
- Append new messages to the current conversation message list
- Use the fixed default assistant configuration (system prompt + model `Qwen/Qwen2.5-7B-Instruct`)
- LLM calls go through the SiliconFlow OpenAI-compatible endpoint: `https://api.siliconflow.cn/v1`

**Edge cases & errors:**

- LLM API failure: show a readable error message; keep the user's sent message
- Empty input: do not send
- Network interruption: prompt to retry

#### F-07: Conversation History List

**Description:** The left side of the chat page (or equivalent layout) lists all conversations for the current user; clicking one switches to it.

**Interaction / rules:**

- Each conversation shows a title (summary of the first user message or **"New Chat"**)
- Sort by `updated_at` descending
- When switching conversations, load the corresponding message history

**Edge cases & errors:**

- No conversation history: show empty state; guide the user to send a first message or create a new conversation

#### F-09: Default Assistant

**Description:** MVP provides no assistant management UI; all users share one preconfigured assistant.

**Interaction / rules:**

- Assistant is configured in database seed or server-side constants
- Fields must include at minimum: `name`, `system_prompt`, `model` (`Qwen/Qwen2.5-7B-Instruct`)
- New conversations automatically associate with this default assistant

---

## 5. Pages & Interaction

### 5.1 Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Redirect | Signed in → `/chat`; signed out → `/login` |
| `/login` | Sign-in page | Email + password |
| `/register` | Registration page | Email + password |
| `/chat` | Chat page | Sidebar history + message area + input |
| `/chat/[conversationId]` | Chat page (specific conversation) | Optional: URL carries the current conversation ID |

### 5.2 Key UI States

- **Default:** Current conversation message list + enabled input
- **Loading:** Skeleton / spinner while sending a message or switching conversations
- **Streaming:** AI reply appended character-by-character / token-by-token
- **Empty:** New conversation with no messages shows brief onboarding copy (English)
- **Error:** LLM or network errors shown in the message area or via toast (English)

### 5.3 Visual & Brand

- **Tone:** Minimal, Professional, Dark
- **Implementation:** fullstack-developer references the `ui-ux-pro-max` skill in the technical design to produce `design-system/MASTER.md`

---

## 6. Permissions & Security (Product Layer)

| Action | Who | Notes |
|--------|-----|-------|
| Register / sign in | Anyone | Public pages |
| Send chat messages | Signed-in user | JWT validation |
| View conversation list | Conversation owner | RLS: `user_id = auth.uid()` |
| View / continue conversation | Conversation owner | Same as above |
| Access LLM API key | Server only | Never exposed to the browser |

---

## 7. Non-Functional Requirements

| Type | Requirement |
|------|-------------|
| Performance | Time-to-first-token feels "real-time streaming" on normal networks (< 3s target; depends on SiliconFlow) |
| Security | Supabase Auth JWT + RLS; `SILICONFLOW_API_KEY` server-side environment variable only |
| Usability | Basically usable on mobile (responsive layout); Dark theme primary |
| Deployment | Vercel; Chat Route `maxDuration` set to 300s per Hobby plan |

---

## 8. Acceptance Criteria

- [ ] **AC-01:** Unauthenticated access to `/chat` redirects to `/login`
- [ ] **AC-02:** After successful email registration, user is auto signed in and lands on `/chat`
- [ ] **AC-03:** After a signed-in user sends a message, the AI reply streams token-by-token
- [ ] **AC-04:** After page refresh, messages for the current conversation load correctly
- [ ] **AC-05:** Sidebar shows the signed-in user's conversation history; clicking an item switches conversations
- [ ] **AC-06:** User can create a new blank conversation; it starts in empty state
- [ ] **AC-07:** On LLM call failure, the UI shows a readable error (no blank screen)
- [ ] **AC-08:** User A cannot see User B's conversations (RLS isolation verified)
- [ ] **AC-09:** AI replies use model `Qwen/Qwen2.5-7B-Instruct` (via SiliconFlow endpoint)

---

## 9. Dependencies & Assumptions

### 9.1 Dependencies

- Supabase project (Auth + PostgreSQL)
- SiliconFlow API account and API key
- Vercel deployment environment (or local `next dev` for development)
- Next.js App Router, Vercel AI SDK, `@supabase/ssr`

### 9.2 Assumptions

- Users can reach `api.siliconflow.cn` normally
- MVP uses a single-user workspace; no organization model
- Default assistant system prompt is set by developers in seed/config; users cannot edit it
- Conversation titles can be auto-generated from a truncated first user message; default title is **"New Chat"**

---

## 10. Open Questions

| ID | Question | Status | Decision |
|----|----------|--------|----------|
| OQ-01 | LLM provider | Resolved | SiliconFlow (OpenAI-compatible, `https://api.siliconflow.cn/v1`) |
| OQ-02 | Default model | Resolved | `Qwen/Qwen2.5-7B-Instruct` |
| OQ-03 | Multi-tenant model | Resolved | Single-user workspace |
| OQ-04 | Default assistant system prompt copy | Resolved | "You are the AI assistant for 7ai-club. Answer clearly and concisely. Match the language the user writes in." |

---

## 11. Revision History

| Date | Version | Iteration | Change |
|------|---------|-----------|--------|
| 2026-06-14 | v0.1 | iter-01 | Initial draft (minimal chat + SiliconFlow + Qwen2.5-7B) |

---

*Iteration index: [docs/iterations/iter-01/README.md](../../iterations/iter-01/README.md)*  
*Next document: [02-technical-design.md](./02-technical-design.md) (produced by fullstack-developer)*
