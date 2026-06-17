# MVP Chat — Technical Design (Index)

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文：** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **Status:** iter-01 confirmed; iter-02/03/04 **shipped**  
> **Version:** v0.5

---

## iter-02 Module Designs (draft)

| Module | Doc |
|--------|-----|
| Landing + C2 + Header | [design/landing.md](./design/landing.md) |
| Delete + Markdown | [design/chat-experience.md](./design/chat-experience.md) |
| Bailian + errors | [design/llm-reliability.md](./design/llm-reliability.md) |

**Implementation order:** llm-reliability → landing → chat-experience.

## iter-04 Module Design (implemented)

| Module | Doc |
|--------|-----|
| Hybrid browser data access | [design/data-access.md](./design/data-access.md) |

**Acceptance:** [changelog/iter-04.md](./changelog/iter-04.md)

See [02-technical-design-cn.md](./02-technical-design-cn.md) for full index.

---

## Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-06-15 | v0.2 | iter-02 module designs |
| 2026-06-16 | v0.4 | iter-04 data-access design draft |
| 2026-06-17 | v0.5 | iter-04 implemented |
