import { afterEach, describe, expect, it } from "vitest";
import {
  getRagChunkOverlapTokens,
  getRagChunkSizeTokens,
} from "@/lib/rag/config";
import {
  DEFAULT_RAG_CHUNK_OVERLAP,
  DEFAULT_RAG_CHUNK_SIZE,
} from "@/lib/rag/defaults";

describe("AC-92 RAG chunk env config", () => {
  const originalSize = process.env.RAG_CHUNK_SIZE;
  const originalOverlap = process.env.RAG_CHUNK_OVERLAP;

  afterEach(() => {
    if (originalSize === undefined) {
      delete process.env.RAG_CHUNK_SIZE;
    } else {
      process.env.RAG_CHUNK_SIZE = originalSize;
    }
    if (originalOverlap === undefined) {
      delete process.env.RAG_CHUNK_OVERLAP;
    } else {
      process.env.RAG_CHUNK_OVERLAP = originalOverlap;
    }
  });

  it("falls back to defaults when env unset", () => {
    delete process.env.RAG_CHUNK_SIZE;
    delete process.env.RAG_CHUNK_OVERLAP;

    expect(getRagChunkSizeTokens()).toBe(DEFAULT_RAG_CHUNK_SIZE);
    expect(getRagChunkOverlapTokens()).toBe(DEFAULT_RAG_CHUNK_OVERLAP);
  });

  it("reads positive integers from env", () => {
    process.env.RAG_CHUNK_SIZE = "256";
    process.env.RAG_CHUNK_OVERLAP = "32";

    expect(getRagChunkSizeTokens()).toBe(256);
    expect(getRagChunkOverlapTokens()).toBe(32);
  });

  it("ignores invalid env values", () => {
    process.env.RAG_CHUNK_SIZE = "not-a-number";
    process.env.RAG_CHUNK_OVERLAP = "-1";

    expect(getRagChunkSizeTokens()).toBe(DEFAULT_RAG_CHUNK_SIZE);
    expect(getRagChunkOverlapTokens()).toBe(DEFAULT_RAG_CHUNK_OVERLAP);
  });
});
