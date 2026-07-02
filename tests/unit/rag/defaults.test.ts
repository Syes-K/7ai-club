import { describe, expect, it } from "vitest";
import {
  DEFAULT_RAG_CHUNK_OVERLAP,
  DEFAULT_RAG_CHUNK_SIZE,
  DEFAULT_RAG_CONFIDENCE,
  DEFAULT_RAG_EMBEDDING_DIMENSIONS,
  DEFAULT_RAG_EMBEDDING_MODEL,
  DEFAULT_RAG_EMBEDDING_PROVIDER,
  DEFAULT_RAG_QUERY_OPTIMIZE_ENABLED,
  DEFAULT_RAG_TOP_K,
} from "@/lib/rag/defaults";

describe("AC-94 RAG defaults", () => {
  it("uses confidence 0.65 and TopK 3 per iter-09 code constants", () => {
    expect(DEFAULT_RAG_CONFIDENCE).toBe(0.65);
    expect(DEFAULT_RAG_TOP_K).toBe(3);
  });

  it("disables query optimization by default", () => {
    expect(DEFAULT_RAG_QUERY_OPTIMIZE_ENABLED).toBe(false);
  });

  it("uses SiliconFlow BGE-M3 1024-dim embedding defaults", () => {
    expect(DEFAULT_RAG_EMBEDDING_PROVIDER).toBe("siliconflow");
    expect(DEFAULT_RAG_EMBEDDING_MODEL).toBe("BAAI/bge-m3");
    expect(DEFAULT_RAG_EMBEDDING_DIMENSIONS).toBe(1024);
  });
});

describe("AC-92 chunk env defaults", () => {
  it("defaults chunk size 512 and overlap 64", () => {
    expect(DEFAULT_RAG_CHUNK_SIZE).toBe(512);
    expect(DEFAULT_RAG_CHUNK_OVERLAP).toBe(64);
  });
});
