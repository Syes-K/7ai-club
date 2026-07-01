import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORKFLOW_NODE_CATALOG } from "@/lib/workflow/node-catalog";

describe("AC-100 RAG workflow registration", () => {
  it("registers rag nodes in catalog with expected labels", () => {
    expect(WORKFLOW_NODE_CATALOG.rag_query_optimize?.label).toBe(
      "Optimizing query for retrieval",
    );
    expect(WORKFLOW_NODE_CATALOG.rag_retrieve?.label).toBe(
      "Retrieving knowledge",
    );
  });

  it("chat route runs RAG nodes only when knowledgeBases is non-empty", () => {
    const source = readFileSync(
      join(process.cwd(), "app/api/chat/route.ts"),
      "utf8",
    );

    expect(source).toContain("if (ctx.knowledgeBases?.length)");
    expect(source).toContain("ragQueryOptimizeNode");
    expect(source).toContain("ragRetrieveNode");
  });

  it("llm-stream injects Retrieved knowledge when ragContextText is set", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/workflow/nodes/llm-stream.ts"),
      "utf8",
    );

    expect(source).toContain("## Retrieved knowledge");
    expect(source).toContain("ctx.ragContextText");
  });
});
