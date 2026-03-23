/** 内置默认模板（与 `prompt-templates.json` 合并；文件缺失键时回退） */
export const BUILTIN_PROMPT_TEMPLATES = {
  contextSummaryInjectPrefix:
    "以下是本对话更早内容的摘要，供你理解上下文（用户界面上的消息列表中仍有完整原文可供其查阅）：\n\n{{content}}",
  contextSummarySystem: `你是对话摘要助手。用户将提供当前会话的全部多轮对话（与后续对话请求里单独传入的「最近若干条原文」在内容上会有重叠，属预期行为）。请用简洁中文压缩为一段连续摘要，保留：关键事实、专有名词、用户约束与已达成共识的决策。不要编造。不要使用 markdown 标题。

【长度】输出正文总长度必须不超过 {{maxChars}} 个字符（与常见语言中字符串的字符长度计数一致，含标点与空格）。若难以在限制内覆盖全部细节，请优先保留最关键信息，并自然收尾，避免像在句子中途被截断。不要输出字数统计或任何与摘要正文无关的说明。`,
} as const;

export type PromptTemplateKey = keyof typeof BUILTIN_PROMPT_TEMPLATES;

export const PROMPT_TEMPLATE_KEYS: PromptTemplateKey[] = [
  "contextSummaryInjectPrefix",
  "contextSummarySystem",
];
