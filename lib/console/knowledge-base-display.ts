import type { KnowledgeBaseRow } from "@/lib/rag/types";

export function sourceSummary(kb: KnowledgeBaseRow): string {
  if (kb.source_type === "file") {
    const parts = [kb.source_filename ?? "Uploaded file"];
    if (kb.source_mime) parts.push(kb.source_mime);
    return parts.join(" · ");
  }
  return "Pasted text";
}

export function displayContent(kb: KnowledgeBaseRow): string | null {
  const markdown = kb.parsed_markdown?.trim();
  if (markdown) return markdown;
  if (kb.source_type === "text") {
    const text = kb.source_text?.trim();
    if (text) return text;
  }
  return null;
}

export function contentEmptyMessage(kb: KnowledgeBaseRow): string {
  if (kb.status === "processing") {
    return "Content will appear after ingestion completes.";
  }
  if (kb.source_type === "file") {
    return "No parsed content yet. Retry ingestion if this persists.";
  }
  return "No content.";
}

export function contentStats(content: string): { characters: number; lines: number } {
  return {
    characters: content.length,
    lines: content.split("\n").length,
  };
}
