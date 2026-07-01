import { describe, expect, it } from "vitest";
import { chunkMarkdown, mergeAdjacentSections } from "@/lib/rag/chunk";

describe("chunkMarkdown", () => {
  it("AC-92: splits on markdown headings", () => {
    const markdown = `# Title

Intro paragraph.

## Section

Section body with enough text to identify.`;

    const chunks = chunkMarkdown(markdown, {
      maxTokens: 512,
      overlapTokens: 64,
    });

    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(
      chunks.some(
        (chunk) =>
          chunk.headingPath?.includes("Section") ||
          chunk.content.includes("Section body"),
      ),
    ).toBe(true);
  });

  it("merges short paragraphs instead of one chunk per blank line", () => {
    const markdown = `Line one.

Line two.

Line three.

Line four.`;

    const chunks = chunkMarkdown(markdown, {
      maxTokens: 512,
      overlapTokens: 64,
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toContain("Line one.");
    expect(chunks[0]?.content).toContain("Line four.");
  });

  it("merges consecutive heading sections until maxTokens", () => {
    const markdown = `# A

Short A.

# B

Short B.

# C

Short C.`;

    const chunks = chunkMarkdown(markdown, {
      maxTokens: 512,
      overlapTokens: 64,
    });

    expect(chunks.length).toBeLessThan(6);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  it("prepends heading path to chunk content", () => {
    const markdown = `# Parent

Body text.`;

    const chunks = chunkMarkdown(markdown, {
      maxTokens: 512,
      overlapTokens: 64,
    });

    expect(chunks[0]?.content.startsWith("Parent\n\nBody text.")).toBe(true);
  });

  it("applies sliding window for long sections", () => {
    const longBody = "word ".repeat(800);
    const markdown = `# Long\n\n${longBody}`;

    const chunks = chunkMarkdown(markdown, {
      maxTokens: 64,
      overlapTokens: 8,
    });

    expect(chunks.length).toBeGreaterThan(1);
  });
});

describe("mergeAdjacentSections", () => {
  it("combines sections while under maxTokens", () => {
    const merged = mergeAdjacentSections(
      [
        { headingPath: null, text: "a", charStart: 0, charEnd: 1 },
        { headingPath: null, text: "b", charStart: 2, charEnd: 3 },
        { headingPath: null, text: "c", charStart: 4, charEnd: 5 },
      ],
      512,
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.text).toBe("a\n\nb\n\nc");
  });
});
