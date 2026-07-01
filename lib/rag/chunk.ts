import { estimateTextTokens } from "@/lib/memory/token-estimate";
import type { ChunkDraft } from "@/lib/rag/types";

type Section = {
  headingPath: string | null;
  text: string;
  charStart: number;
  charEnd: number;
};

function splitMarkdownSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let headingStack: string[] = [];
  let buffer: string[] = [];
  let bufferStart = 0;
  let cursor = 0;

  function flushBuffer() {
    if (buffer.length === 0) {
      return;
    }
    const text = buffer.join("\n").trim();
    if (!text) {
      buffer = [];
      return;
    }
    sections.push({
      headingPath: headingStack.length ? headingStack.join(" > ") : null,
      text,
      charStart: bufferStart,
      charEnd: bufferStart + text.length,
    });
    buffer = [];
  }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushBuffer();
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      headingStack = headingStack.slice(0, level - 1);
      headingStack[level - 1] = title;
      cursor += line.length + 1;
      continue;
    }

    if (buffer.length === 0) {
      bufferStart = cursor;
    }

    buffer.push(line);
    cursor += line.length + 1;
  }

  flushBuffer();

  if (sections.length === 0 && markdown.trim()) {
    const trimmed = markdown.trim();
    const start = markdown.indexOf(trimmed);
    sections.push({
      headingPath: null,
      text: trimmed,
      charStart: start,
      charEnd: start + trimmed.length,
    });
  }

  return sections;
}

/** Greedy merge: combine consecutive sections until maxTokens would be exceeded. */
export function mergeAdjacentSections(
  sections: Section[],
  maxTokens: number,
): Section[] {
  if (sections.length <= 1) {
    return sections;
  }

  const merged: Section[] = [];
  let current = { ...sections[0]! };

  for (let i = 1; i < sections.length; i++) {
    const next = sections[i]!;
    const combinedText = `${current.text}\n\n${next.text}`.trim();
    if (estimateTextTokens(combinedText) <= maxTokens) {
      current = {
        headingPath: next.headingPath ?? current.headingPath,
        text: combinedText,
        charStart: current.charStart,
        charEnd: next.charEnd,
      };
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}

function formatChunkContent(section: Section, slice: string): string {
  const body = slice.trim();
  if (!body) {
    return body;
  }
  if (!section.headingPath) {
    return body;
  }
  return `${section.headingPath}\n\n${body}`;
}

function slidingWindowChunks(
  section: Section,
  options: { maxTokens: number; overlapTokens: number },
): ChunkDraft[] {
  const { maxTokens, overlapTokens } = options;
  const text = section.text;
  const maxChars = Math.max(maxTokens * 4, 64);
  const overlapChars = Math.min(overlapTokens * 4, maxChars - 1);
  const step = Math.max(maxChars - overlapChars, 1);
  const chunks: ChunkDraft[] = [];
  let index = 0;

  for (let start = 0; start < text.length; start += step) {
    const slice = text.slice(start, start + maxChars).trim();
    if (!slice) {
      continue;
    }
    const absoluteStart = section.charStart + start;
    chunks.push({
      chunkIndex: index,
      content: formatChunkContent(section, slice),
      headingPath: section.headingPath,
      charStart: absoluteStart,
      charEnd: absoluteStart + slice.length,
    });
    index += 1;
    if (start + maxChars >= text.length) {
      break;
    }
  }

  return chunks;
}

export function chunkMarkdown(
  markdown: string,
  options: { maxTokens: number; overlapTokens: number },
): ChunkDraft[] {
  const sections = mergeAdjacentSections(
    splitMarkdownSections(markdown),
    options.maxTokens,
  );
  const output: ChunkDraft[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const tokenEstimate = estimateTextTokens(section.text);
    const sectionChunks =
      tokenEstimate <= options.maxTokens
        ? [
            {
              chunkIndex: 0,
              content: formatChunkContent(section, section.text),
              headingPath: section.headingPath,
              charStart: section.charStart,
              charEnd: section.charEnd,
            },
          ]
        : slidingWindowChunks(section, options);

    for (const chunk of sectionChunks) {
      output.push({ ...chunk, chunkIndex });
      chunkIndex += 1;
    }
  }

  return output;
}
