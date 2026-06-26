# Agent orchestration — Technical design index

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文:** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `agent-orchestration`  
> **Roadmap phase:** 2 — Agent orchestration foundation  
> **Related PRD:** [01-product-requirements.md](./01-product-requirements.md)  
> **Status:** iter-06 **released** · iter-07 **released** · **iter-08 in progress**  
> **Design date:** iter-06 · 2026-06-24 · iter-07 · 2026-06-25 · iter-08 · 2026-06-26  
> **Doc version:** v0.6

---

## 1. Overview

**iter-06 (released):** WorkflowRunner, 4-node pipeline, Upstash resume, workflow logs.

**iter-07 (released):** History summarization — 3 new nodes, Preferences extensions, rolling summary + soft archive.

**iter-08 (in progress):** Workflow step UI refactor — default-collapsed panel, registry components, StepEvent protocol, Reasoning stream.

**Required reading for iter-08:**

1. [changelog/iter-08.md](./changelog/iter-08.md)  
2. [prd/workflow-step-ui.md](./prd/workflow-step-ui.md)  
3. [design/workflow-step-ui.md](./design/workflow-step-ui.md)

Full CN index: [02-technical-design-cn.md](./02-technical-design-cn.md).

---

## 2. Design document map

| Doc | Scope | Status |
|-----|-------|--------|
| [design/workflow-orchestration.md](./design/workflow-orchestration.md) | iter-06 workflow | Released |
| [design/stream-resume.md](./design/stream-resume.md) | iter-06 resume | Released |
| [design/history-summarization.md](./design/history-summarization.md) | iter-07 memory | Released |
| [design/workflow-step-ui.md](./design/workflow-step-ui.md) | iter-08 step UI | **Draft** |

---

## 3. Revision history

| Date | Version | Change |
|------|---------|--------|
| 2026-06-24 | v0.1 | iter-06 |
| 2026-06-25 | v0.2 | iter-07 summarization design draft |
| 2026-06-25 | v0.3 | **Option B** — post-LLM evaluate/summarize |
| 2026-06-25 | v0.4 | Design confirmed; implementation complete |
| 2026-06-26 | v0.5 | QA passed; iter-07 **released** |
| 2026-06-26 | v0.6 | iter-08 workflow step UI design draft |
