import { z } from "zod";
import {
  KB_MAX_FILE_BYTES,
  KB_MAX_TEXT_CHARS,
} from "@/lib/rag/defaults";

export const KB_NAME_MAX = 64;
export const KB_DESCRIPTION_MAX = 500;

const allowedExtensions = [".md", ".txt", ".markdown", ".pdf", ".docx"];

export function isAllowedKnowledgeFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return allowedExtensions.some((ext) => lower.endsWith(ext));
}

export const createKnowledgeBaseJsonSchema = z.object({
  name: z.string().trim().min(1).max(KB_NAME_MAX),
  description: z
    .string()
    .trim()
    .max(KB_DESCRIPTION_MAX)
    .optional()
    .nullable(),
  sourceType: z.literal("text"),
  text: z.string().trim().min(1).max(KB_MAX_TEXT_CHARS),
});

export const updateKnowledgeBaseSchema = z.object({
  name: z.string().trim().min(1).max(KB_NAME_MAX).optional(),
  description: z
    .string()
    .trim()
    .max(KB_DESCRIPTION_MAX)
    .optional()
    .nullable(),
});

export const recallTestSchema = z.object({
  query: z.string().trim().min(1).max(4000),
  confidenceThreshold: z.number().finite().gt(0).lte(1).optional(),
  topK: z.number().int().min(1).max(50).optional(),
});

export const replaceKnowledgeBaseTextSchema = z.object({
  text: z.string().trim().min(1).max(KB_MAX_TEXT_CHARS),
});

export function parseReplaceKnowledgeBaseFileForm(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "File is required" };
  }
  if (file.size <= 0) {
    return { error: "File is empty" };
  }
  if (file.size > KB_MAX_FILE_BYTES) {
    return { error: "File exceeds 10 MB limit" };
  }
  if (!isAllowedKnowledgeFile(file.name)) {
    return { error: "Unsupported file type" };
  }

  return { data: { file } };
}

export function parseCreateKnowledgeBaseForm(formData: FormData) {
  const sourceType = formData.get("sourceType")?.toString();
  const name = formData.get("name")?.toString() ?? "";
  const description = formData.get("description")?.toString() ?? "";

  if (sourceType === "text") {
    const parsed = createKnowledgeBaseJsonSchema.safeParse({
      name,
      description: description || null,
      sourceType: "text",
      text: formData.get("text")?.toString() ?? "",
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid request" };
    }
    return { data: parsed.data };
  }

  if (sourceType === "file") {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { error: "File is required" };
    }
    if (file.size <= 0) {
      return { error: "File is empty" };
    }
    if (file.size > KB_MAX_FILE_BYTES) {
      return { error: "File exceeds 10 MB limit" };
    }
    if (!isAllowedKnowledgeFile(file.name)) {
      return { error: "Unsupported file type" };
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > KB_NAME_MAX) {
      return { error: "Invalid name" };
    }

    return {
      data: {
        name: trimmedName,
        description: description.trim() || null,
        sourceType: "file" as const,
        file,
      },
    };
  }

  return { error: "Invalid source type" };
}
