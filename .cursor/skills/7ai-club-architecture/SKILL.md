---
name: 7ai-club-architecture
description: >
  7ai-club 平台架构决策手册。包含技术栈、方案 B 编排、工程约束、实施路线图与待决问题。
  在写 PRD、技术设计、API、数据库 schema 或讨论 n8n/MCP/RAG/超时 时使用。
  优先读本 skill 的 reference.md；完整论证见 docs/research/。
disable-model-invocation: true
---

# 7ai-club 架构参考

## 何时使用

- `product-analyst` / `fullstack-developer` 需要架构上下文时
- 用户讨论技术选型、MVP 范围、方案对比时
- 写技术设计中的数据库、API、Agent 流程时

## 阅读顺序

1. **本文件** — 加载指引
2. **[reference.md](reference.md)** — 决策手册（默认只读此文件，约 2k token）
3. **按需深读** — 仅当 reference 不足以决策时，Read 调研原文相关章节：
   - `docs/research/ai-agent-platform-architecture-cn.md`（中文）
   - `docs/research/ai-agent-platform-architecture.md`（英文）

## 维护约定

架构决策变更时：先更新 `docs/research/`，再同步 `reference.md`。
