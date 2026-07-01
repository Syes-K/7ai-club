import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { KB_STORAGE_BUCKET } from "@/lib/rag/defaults";
import type { KnowledgeBaseRow } from "@/lib/rag/types";

const TEXT_EXTENSIONS = new Set([".md", ".txt", ".markdown"]);

function getExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index === -1 ? "" : filename.slice(index).toLowerCase();
}

async function parseFileBuffer(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const ext = getExtension(filename);

  if (TEXT_EXTENSIONS.has(ext)) {
    return buffer.toString("utf-8");
  }

  if (ext === ".pdf" || ext === ".docx") {
    const tempDir = await mkdtemp(join(tmpdir(), "kb-ingest-"));
    const tempPath = join(tempDir, filename.replace(/[^\w.-]+/g, "_") || "upload");
    try {
      await writeFile(tempPath, buffer);
      const { convertToMarkdown } = await import("doc-to-md-rag");
      return await convertToMarkdown(tempPath);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  throw new Error(`Unsupported file type: ${ext || "unknown"}`);
}

export async function parseKnowledgeBaseSource(
  kb: KnowledgeBaseRow,
  service: SupabaseClient,
): Promise<string> {
  if (kb.source_type === "text") {
    const text = kb.source_text?.trim();
    if (!text) {
      throw new Error("Knowledge base text source is empty");
    }
    return text;
  }

  if (!kb.storage_path) {
    throw new Error("Knowledge base file path is missing");
  }

  const { data, error } = await service.storage
    .from(KB_STORAGE_BUCKET)
    .download(kb.storage_path);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to download knowledge base file");
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const filename = kb.source_filename ?? "upload.bin";
  return parseFileBuffer(buffer, filename);
}

export async function parseLocalFile(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return parseFileBuffer(buffer, filePath);
}
