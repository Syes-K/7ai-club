import type { PromptTemplateKey } from "./builtin";
import { PROMPT_TEMPLATE_KEYS } from "./builtin";
import { validateContextSummaryInjectForSave } from "./inject-prefix";
import { collectPlaceholderNames } from "./render";

const EMPTY_MSG = "模板不能为空";
const SYSTEM_NEED_MAX_CHARS_MSG = "须包含 {{maxChars}}";
const SYSTEM_UNKNOWN_PLACEHOLDER_MSG = (allowed: string) =>
  `仅允许占位符：${allowed}`;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export type PromptTemplatesPayload = Record<PromptTemplateKey, string>;

export function validatePromptTemplatesForSave(
  json: unknown
): { ok: true; templates: PromptTemplatesPayload } | { ok: false; error: string } {
  if (!isRecord(json)) {
    return { ok: false, error: "请求体须为 JSON 对象" };
  }

  const out: Partial<PromptTemplatesPayload> = {};

  for (const key of PROMPT_TEMPLATE_KEYS) {
    const raw = json[key];
    if (typeof raw !== "string") {
      return { ok: false, error: `缺少或类型错误：${key}` };
    }
    const s = raw.trim();
    if (!s) {
      return { ok: false, error: EMPTY_MSG };
    }

    if (key === "contextSummaryInjectPrefix") {
      const inj = validateContextSummaryInjectForSave(raw);
      if (!inj.ok) {
        return { ok: false, error: inj.error };
      }
    } else if (key === "contextSummarySystem") {
      const names = collectPlaceholderNames(s);
      if (!s.includes("{{maxChars}}")) {
        return { ok: false, error: SYSTEM_NEED_MAX_CHARS_MSG };
      }
      for (const n of names) {
        if (n !== "maxChars") {
          return {
            ok: false,
            error: SYSTEM_UNKNOWN_PLACEHOLDER_MSG("{{maxChars}}"),
          };
        }
      }
    }

    out[key] = raw;
  }

  return { ok: true, templates: out as PromptTemplatesPayload };
}
