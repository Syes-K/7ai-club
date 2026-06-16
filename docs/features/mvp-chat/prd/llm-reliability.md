# LLM Reliability (Multi-Provider · Bailian · Errors)

> **English:** [llm-reliability.md](./llm-reliability.md)  
> **中文：** [llm-reliability-cn.md](./llm-reliability-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-01 / iter-02

---

## 1. Scope

F-14 multi-provider env; F-15 Bailian abort fix and error UX.

---

## 2. F-14 Multi-Provider (iter-01, shipped)

`LLM_PROVIDER` + `LLM_MODEL`; SiliconFlow / NVIDIA / Bailian. AC-09 v0.1 superseded.

---

## 3. F-15 Bailian Stability (iter-02)

Suspected chunk timeout vs `qwen3.6-plus` thinking mode. Tasks T-01–T-04 in [iter-02 README](../../../iterations/iter-02/README.md).

---

## 4. Acceptance Criteria

- [x] **AC-09**
- [x] **AC-19**, **AC-20** (code; re-test Bailian streaming)

---

## 5. Revision History

| Date | Change |
|------|--------|
| 2026-06-15 | Split from index |
| 2026-06-16 | Local implementation complete |
