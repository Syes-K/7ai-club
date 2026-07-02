import { describe, expect, it } from "vitest";
import {
  createKnowledgeBaseJsonSchema,
  isAllowedKnowledgeFile,
  parseCreateKnowledgeBaseForm,
  recallTestSchema,
} from "@/lib/validation/knowledge-base";

describe("AC-90 knowledge base validation", () => {
  it("accepts valid text source payload", () => {
    const parsed = createKnowledgeBaseJsonSchema.safeParse({
      name: "Product FAQ",
      description: "Internal docs",
      sourceType: "text",
      text: "# FAQ\n\nAnswer one.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty name", () => {
    const parsed = createKnowledgeBaseJsonSchema.safeParse({
      name: "",
      sourceType: "text",
      text: "content",
    });

    expect(parsed.success).toBe(false);
  });

  it("allows supported file extensions only", () => {
    expect(isAllowedKnowledgeFile("guide.pdf")).toBe(true);
    expect(isAllowedKnowledgeFile("notes.md")).toBe(true);
    expect(isAllowedKnowledgeFile("archive.zip")).toBe(false);
  });

  it("parseCreateKnowledgeBaseForm accepts multipart text source", () => {
    const formData = new FormData();
    formData.set("sourceType", "text");
    formData.set("name", "E2E KB");
    formData.set("description", "desc");
    formData.set("text", "Marker content for retrieval.");

    const result = parseCreateKnowledgeBaseForm(formData);
    expect(result.error).toBeUndefined();
    expect(result.data?.sourceType).toBe("text");
    expect(result.data && "text" in result.data && result.data.text).toContain(
      "Marker",
    );
  });

  it("parseCreateKnowledgeBaseForm rejects unsupported file type", () => {
    const formData = new FormData();
    formData.set("sourceType", "file");
    formData.set("name", "Bad file");
    formData.set(
      "file",
      new File(["data"], "payload.exe", { type: "application/octet-stream" }),
    );

    const result = parseCreateKnowledgeBaseForm(formData);
    expect(result.error).toBe("Unsupported file type");
  });
});

describe("AC-93 recall test validation", () => {
  it("accepts optional confidence and topK overrides", () => {
    const parsed = recallTestSchema.safeParse({
      query: "What is the refund policy?",
      confidenceThreshold: 0.65,
      topK: 3,
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.topK).toBe(3);
  });

  it("accepts optional queryOptimize override", () => {
    const parsed = recallTestSchema.safeParse({
      query: "Before you start selling",
      queryOptimize: true,
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.queryOptimize).toBe(true);
  });

  it("rejects empty query", () => {
    const parsed = recallTestSchema.safeParse({ query: "   " });
    expect(parsed.success).toBe(false);
  });
});
