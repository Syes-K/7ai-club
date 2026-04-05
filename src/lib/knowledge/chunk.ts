/** 单块文本及其在整篇文档 body 上的 UTF-16 码元区间 [charStart, charEnd)。 */
export type TextChunk = {
  text: string;
  charStart: number;
  charEnd: number;
};

const DEFAULT_SIZE = 512;
const DEFAULT_OVERLAP = 64;
/** 断句点须不早于块前 30%，避免过早截断导致块过短。 */
const MIN_BREAK_RATIO = 0.3;

/** 在当前切片末尾附近找优先断点（空行 > 单行换行 > 标点），否则返回 chunkSize 硬切。 */
function findBreakOffset(slice: string, chunkSize: number): number {
  const minPos = Math.floor(chunkSize * MIN_BREAK_RATIO);
  const nn = slice.lastIndexOf("\n\n");
  if (nn >= minPos) return nn + 2;
  const nl = slice.lastIndexOf("\n");
  if (nl >= minPos) return nl + 1;
  const punct = ["。", "．", ".", "！", "？", "；", ";", "，", ","];
  for (const sep of punct) {
    const i = slice.lastIndexOf(sep);
    if (i >= minPos) return i + 1;
  }
  return chunkSize;
}

/**
 * 按设计：块长 512、重叠 64；切分边界优先换行与中文/英文标点。
 * 索引为 JS 字符串码元（UTF-16），与 `String.length` 一致。
 */
export function chunkText(
  body: string,
  chunkSize = DEFAULT_SIZE,
  overlap = DEFAULT_OVERLAP
): TextChunk[] {
  // 安全兜底：防止配置错误导致切分窗口不合理（overlap < chunkSize）
  chunkSize = Number.isFinite(chunkSize) ? Math.max(1, Math.floor(chunkSize)) : DEFAULT_SIZE;
  overlap = Number.isFinite(overlap)
    ? Math.max(0, Math.floor(overlap))
    : DEFAULT_OVERLAP;
  overlap = Math.min(overlap, Math.max(0, chunkSize - 1));

  const trimmed = body;
  const n = trimmed.length;
  if (n === 0) return [];
  if (n <= chunkSize) {
    return [{ text: trimmed, charStart: 0, charEnd: n }];
  }

  const out: TextChunk[] = [];
  let start = 0;
  while (start < n) {
    let end = Math.min(start + chunkSize, n);
    if (end < n) {
      const slice = trimmed.slice(start, end);
      const relBreak = findBreakOffset(slice, slice.length);
      if (relBreak > 0 && relBreak < slice.length) {
        end = start + relBreak;
      }
    }
    const text = trimmed.slice(start, end);
    out.push({ text, charStart: start, charEnd: end });
    if (end >= n) break;
    // 滑动窗口：下一块起点 = 本块尾回退 overlap，且至少前进 1 防止死循环
    start = Math.max(end - overlap, start + 1);
  }
  return out;
}
