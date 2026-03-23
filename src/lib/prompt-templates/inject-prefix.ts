import { collectPlaceholderNames } from "./render";

/**
 * 摘要注入前缀：可无占位符（摘要正文仍拼在渲染结果后），或使用恰好一处 `{{content}}` 且须在模板末尾。
 * 占位符前须有至少一个字符（不能整段只有 {{content}}）。
 */
export function isUsableContextSummaryInjectPrefix(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  const names = collectPlaceholderNames(t);
  if (names.length === 0) return true;
  if (!/^[\s\S]+\{\{content\}\}\s*$/.test(t)) return false;
  const occ = t.match(/\{\{content\}\}/g);
  if (!occ || occ.length !== 1) return false;
  return names.length === 1 && names[0] === "content";
}

export function validateContextSummaryInjectForSave(
  raw: string
): { ok: true } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: "模板不能为空" };
  const names = collectPlaceholderNames(t);
  if (names.length === 0) return { ok: true };
  if (!/^[\s\S]+\{\{content\}\}\s*$/.test(t)) {
    return {
      ok: false,
      error:
        "若使用 {{content}}，须恰好一处且放在模板末尾（前面须有说明文字）",
    };
  }
  const occ = t.match(/\{\{content\}\}/g);
  if (!occ || occ.length !== 1) {
    return { ok: false, error: "{{content}} 仅能出现一次" };
  }
  for (const n of names) {
    if (n !== "content") {
      return { ok: false, error: "仅允许占位符 {{content}}" };
    }
  }
  return { ok: true };
}

/** 合并后的合法模板：是否用 {{content}} 承接摘要正文（与无占位符拼接二选一） */
export function contextSummaryInjectUsesContentPlaceholder(
  template: string
): boolean {
  return isUsableContextSummaryInjectPrefix(template) &&
    collectPlaceholderNames(template).length > 0;
}
