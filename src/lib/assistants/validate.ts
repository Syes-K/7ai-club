import { getKnowledgeStore } from "@/lib/knowledge";
import type { AssistantInput } from "./types";

const NAME_MAX = 80;
const PROMPT_MAX = 32_000;
const ICON_MAX = 16;
const KB_MAX = 16;
const OPENING_MESSAGE_MAX = 4000;

export type ValidateAssistantResult =
  | { ok: true; data: AssistantInput }
  | { ok: false; error: string };

function dedupeStrings(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * 校验并规范化助手写入数据。
 */
export function validateAssistantInput(raw: unknown): ValidateAssistantResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "请求体须为 JSON 对象" };
  }
  const o = raw as Record<string, unknown>;

  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (name.length < 1 || name.length > NAME_MAX) {
    return { ok: false, error: `名称长度须在 1～${NAME_MAX} 字符` };
  }

  const prompt = typeof o.prompt === "string" ? o.prompt.trim() : "";
  if (prompt.length < 1 || prompt.length > PROMPT_MAX) {
    return { ok: false, error: `提示词长度须在 1～${PROMPT_MAX} 字符` };
  }

  let iconEmoji: string | null = null;
  if (o.iconEmoji !== undefined && o.iconEmoji !== null) {
    if (typeof o.iconEmoji !== "string") {
      return { ok: false, error: "iconEmoji 须为字符串" };
    }
    const t = o.iconEmoji.trim();
    if (t.length > ICON_MAX) {
      return { ok: false, error: `图标长度不超过 ${ICON_MAX} 字符` };
    }
    iconEmoji = t.length > 0 ? t : null;
  }

  const kbRaw = o.knowledgeBaseIds;
  let knowledgeBaseIds: string[] = [];
  if (kbRaw !== undefined && kbRaw !== null) {
    if (!Array.isArray(kbRaw)) {
      return { ok: false, error: "knowledgeBaseIds 须为数组" };
    }
    knowledgeBaseIds = kbRaw
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
    if (knowledgeBaseIds.length > KB_MAX) {
      return { ok: false, error: `关联知识库不超过 ${KB_MAX} 个` };
    }
    knowledgeBaseIds = dedupeStrings(knowledgeBaseIds);
    const ks = getKnowledgeStore();
    for (const id of knowledgeBaseIds) {
      if (!ks.getBase(id)) {
        return { ok: false, error: `知识库不存在: ${id}` };
      }
    }
  }

  let openingMessage = "";
  if (o.openingMessage !== undefined && o.openingMessage !== null) {
    if (typeof o.openingMessage !== "string") {
      return { ok: false, error: "openingMessage 须为字符串" };
    }
    openingMessage = o.openingMessage.trim();
    if (openingMessage.length > OPENING_MESSAGE_MAX) {
      return {
        ok: false,
        error: `开场白不超过 ${OPENING_MESSAGE_MAX} 字符`,
      };
    }
  }

  return {
    ok: true,
    data: {
      name,
      prompt,
      iconEmoji,
      knowledgeBaseIds,
      openingMessage,
    },
  };
}
