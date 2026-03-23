import fs from "node:fs";
import path from "node:path";
import {
  BUILTIN_PROMPT_TEMPLATES,
  type PromptTemplateKey,
  PROMPT_TEMPLATE_KEYS,
} from "./builtin";
import { getPromptTemplatesFilePath } from "@/lib/config/paths";
import { isUsableContextSummaryInjectPrefix } from "./inject-prefix";
import { collectPlaceholderNames, renderTemplateString } from "./render";
import type { PromptTemplatesPayload } from "./validate-save";

export type PromptTemplatesReadMeta = {
  templates: PromptTemplatesPayload;
  warning: string | null;
};

function diskValueIsUsable(key: PromptTemplateKey, value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  if (key === "contextSummaryInjectPrefix") {
    return isUsableContextSummaryInjectPrefix(value);
  }
  const names = collectPlaceholderNames(s);
  if (!s.includes("{{maxChars}}")) return false;
  return names.length > 0 && names.every((n) => n === "maxChars");
}

function mergeFromDisk(parsed: unknown): PromptTemplatesPayload {
  const base: PromptTemplatesPayload = {
    ...BUILTIN_PROMPT_TEMPLATES,
  };
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return base;
  }
  const o = parsed as Record<string, unknown>;
  for (const key of PROMPT_TEMPLATE_KEYS) {
    const v = o[key];
    if (typeof v === "string" && diskValueIsUsable(key, v)) {
      base[key] = v;
    }
  }
  return base;
}

export function readPromptTemplatesWithMeta(): PromptTemplatesReadMeta {
  const filePath = getPromptTemplatesFilePath();
  if (!fs.existsSync(filePath)) {
    return {
      templates: { ...BUILTIN_PROMPT_TEMPLATES },
      warning: null,
    };
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return {
      templates: mergeFromDisk(parsed),
      warning: null,
    };
  } catch {
    return {
      templates: { ...BUILTIN_PROMPT_TEMPLATES },
      warning:
        "提示词文件无法解析，已使用内置默认模板。保存后将写入新文件。",
    };
  }
}

export function getPromptTemplatesMerged(): PromptTemplatesPayload {
  return readPromptTemplatesWithMeta().templates;
}

export function writePromptTemplatesAtomic(
  templates: PromptTemplatesPayload
): void {
  const filePath = getPromptTemplatesFilePath();
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  const payload = `${JSON.stringify(templates, null, 2)}\n`;
  fs.writeFileSync(tmp, payload, "utf8");
  fs.renameSync(tmp, filePath);
}

/**
 * 按配置键取合并后的模板字符串并替换占位符。
 */
export function renderPromptTemplate(
  key: PromptTemplateKey,
  vars: Record<string, string | number>
): string {
  const merged = getPromptTemplatesMerged();
  return renderTemplateString(merged[key], vars);
}
