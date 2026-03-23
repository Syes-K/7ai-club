/**
 * 长度校验与 JS `String.prototype.length` 一致（UTF-16 码元），与 PRD「字符」表述对齐。
 */
const NAME_MIN = 1;
const NAME_MAX = 120;
const TITLE_MAX = 200;
const BODY_MIN = 1;
const BODY_MAX = 100_000;

export function validateBaseName(name: string): { ok: true } | { ok: false; error: string } {
  const s = name.trim();
  if (s.length < NAME_MIN) return { ok: false, error: "知识库名称不能为空" };
  if (s.length > NAME_MAX) return { ok: false, error: `知识库名称不能超过 ${NAME_MAX} 个字符` };
  return { ok: true };
}

export function validateEntryTitle(
  title: string | null | undefined
): { ok: true; title: string | null } | { ok: false; error: string } {
  if (title == null || title === "") return { ok: true, title: null };
  const s = title.trim();
  if (s.length > TITLE_MAX) {
    return { ok: false, error: `标题不能超过 ${TITLE_MAX} 个字符` };
  }
  return { ok: true, title: s || null };
}

export function validateEntryBody(
  body: string
): { ok: true; body: string } | { ok: false; error: string } {
  const s = body.trim();
  if (s.length < BODY_MIN) return { ok: false, error: "正文不能为空" };
  if (s.length > BODY_MAX) {
    return { ok: false, error: `正文不能超过 ${BODY_MAX} 个字符` };
  }
  return { ok: true, body: s };
}
