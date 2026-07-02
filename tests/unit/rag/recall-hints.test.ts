import { describe, expect, it } from "vitest";
import {
  formatRecallThresholdHint,
  suggestRecallThreshold,
} from "@/lib/rag/recall-hints";

describe("recall threshold hints", () => {
  it("suggests threshold slightly below best score", () => {
    expect(suggestRecallThreshold(0.525)).toBe(0.5);
    expect(suggestRecallThreshold(0.72)).toBe(0.7);
  });

  it("uses KB embedding model instead of hardcoded BGE-M3", () => {
    const hint = formatRecallThresholdHint({
      embeddingProvider: "siliconflow",
      embeddingModel: "BAAI/bge-large-en-v1.5",
      profileThreshold: 0.55,
      bestScore: 0.525,
    });

    expect(hint).toContain("BAAI/bge-large-en-v1.5");
    expect(hint).not.toContain("BGE-M3");
    expect(hint).toContain("0.50");
  });
});
