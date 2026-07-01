import { describe, expect, it, vi } from "vitest";
import type { RagHit } from "@/lib/rag/types";
import {
  formatRagContext,
  formatRagHitsDetail,
  retrieveChunks,
} from "@/lib/rag/retrieve";

vi.mock("@/lib/rag/embed", () => ({
  embedQuery: vi.fn().mockResolvedValue(new Array(1024).fill(0.01)),
}));

describe("AC-97 formatRagHitsDetail", () => {
  const sampleHit: RagHit = {
    kbId: "kb-1",
    kbName: "Product FAQ",
    chunkId: "chunk-1",
    content: "Refunds are available within 30 days of purchase.",
    headingPath: "Billing > Refunds",
    charStart: 10,
    charEnd: 60,
    score: 0.712,
  };

  it("includes score, kb name, and location", () => {
    const detail = formatRagHitsDetail([sampleHit]);

    expect(detail).toContain("0.712");
    expect(detail).toContain("Product FAQ");
    expect(detail).toContain("Billing > Refunds");
    expect(detail).toContain("Refunds are available");
  });

  it("returns empty-state message when no hits", () => {
    expect(formatRagHitsDetail([])).toBe("No knowledge matched.");
  });

  it("truncates long content excerpts", () => {
    const longHit: RagHit = {
      ...sampleHit,
      content: "x".repeat(400),
    };

    const detail = formatRagHitsDetail([longHit]);
    expect(detail).toContain("…");
    expect(detail.length).toBeLessThan(500);
  });
});

describe("AC-98 formatRagContext", () => {
  it("builds Retrieved knowledge section payload with source headers", () => {
    const context = formatRagContext([
      {
        kbId: "kb-1",
        kbName: "FAQ",
        chunkId: "c1",
        content: "E2E-KB-MARKER-12345 is the secret phrase.",
        headingPath: "Secrets",
        charStart: 0,
        charEnd: 40,
        score: 0.8,
      },
    ]);

    expect(context).toContain("[Source: FAQ | Secrets]");
    expect(context).toContain("E2E-KB-MARKER-12345");
  });

  it("returns empty string when no hits", () => {
    expect(formatRagContext([])).toBe("");
  });
});

describe("AC-97 retrieveChunks", () => {
  it("returns empty array when bindings are empty", async () => {
    const supabase = { rpc: vi.fn() } as never;

    const hits = await retrieveChunks({
      supabase,
      userId: "user-1",
      bindings: [],
      query: "test",
      threshold: 0.65,
      topK: 3,
    });

    expect(hits).toEqual([]);
  });
});
