import {
  normalizePreferredConfigId,
  PLATFORM_DEFAULT_CONFIG_ID,
  SUMMARY_SAME_AS_CHAT_ID,
} from "@/lib/constants/model-providers";

export const NICKNAME_MAX_LENGTH = 32;

export function validateNickname(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return `Nickname must be ${NICKNAME_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

function parsePositiveInt(
  value: unknown,
  fieldLabel: string,
  min: number,
): { value?: number; error?: string } {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min) {
    return { error: `Invalid ${fieldLabel}` };
  }
  return { value };
}

function parseSummaryModelConfigId(
  raw: unknown,
  allowedIds: Set<string>,
): { value?: string | null; error?: string } {
  if (raw == null || raw === "" || raw === SUMMARY_SAME_AS_CHAT_ID) {
    return { value: null };
  }

  if (typeof raw !== "string") {
    return { error: "Invalid summary model" };
  }

  if (raw === PLATFORM_DEFAULT_CONFIG_ID) {
    return { value: null };
  }

  if (!allowedIds.has(raw)) {
    return { error: "Selected summary model is not available" };
  }

  return { value: normalizePreferredConfigId(raw) };
}

export function parseAccountPatch(body: {
  nickname?: unknown;
}): {
  fields?: { nickname: string | null };
  error?: string;
} {
  if (!("nickname" in body)) {
    return { error: "No fields to update" };
  }

  const raw = body.nickname;
  if (raw != null && typeof raw !== "string") {
    return { error: "Invalid nickname" };
  }

  const trimmed = raw?.trim() ?? "";
  const nicknameError = validateNickname(trimmed || null);
  if (nicknameError) {
    return { error: nicknameError };
  }

  return { fields: { nickname: trimmed || null } };
}

export type PreferencesPatchFields = {
  preferredModelConfigId?: string | null;
  summarizationEnabled?: boolean;
  summaryTriggerTurns?: number;
  summaryRetainTurns?: number;
  summaryTriggerTokens?: number;
  summaryRetainTokens?: number;
  summaryModelConfigId?: string | null;
};

export function parsePreferencesPatch(
  body: {
    preferredModelConfigId?: unknown;
    summarizationEnabled?: unknown;
    summaryTriggerTurns?: unknown;
    summaryRetainTurns?: unknown;
    summaryTriggerTokens?: unknown;
    summaryRetainTokens?: unknown;
    summaryModelConfigId?: unknown;
  },
  allowedIds: Set<string>,
): {
  fields?: PreferencesPatchFields;
  error?: string;
} {
  const hasAnyField =
    "preferredModelConfigId" in body ||
    "summarizationEnabled" in body ||
    "summaryTriggerTurns" in body ||
    "summaryRetainTurns" in body ||
    "summaryTriggerTokens" in body ||
    "summaryRetainTokens" in body ||
    "summaryModelConfigId" in body;

  if (!hasAnyField) {
    return { error: "No fields to update" };
  }

  const fields: PreferencesPatchFields = {};

  if ("preferredModelConfigId" in body) {
    const raw = body.preferredModelConfigId;
    if (raw == null || raw === "") {
      fields.preferredModelConfigId = null;
    } else if (typeof raw !== "string") {
      return { error: "Invalid model preference" };
    } else if (raw === PLATFORM_DEFAULT_CONFIG_ID) {
      fields.preferredModelConfigId = null;
    } else if (!allowedIds.has(raw)) {
      return { error: "Selected model is not available" };
    } else {
      fields.preferredModelConfigId = normalizePreferredConfigId(raw);
    }
  }

  if ("summarizationEnabled" in body) {
    if (typeof body.summarizationEnabled !== "boolean") {
      return { error: "Invalid summarization setting" };
    }
    fields.summarizationEnabled = body.summarizationEnabled;
  }

  if ("summaryTriggerTurns" in body) {
    const parsed = parsePositiveInt(
      body.summaryTriggerTurns,
      "trigger turn count",
      1,
    );
    if (parsed.error) return parsed;
    fields.summaryTriggerTurns = parsed.value;
  }

  if ("summaryRetainTurns" in body) {
    const parsed = parsePositiveInt(
      body.summaryRetainTurns,
      "retain turn count",
      0,
    );
    if (parsed.error) return parsed;
    fields.summaryRetainTurns = parsed.value;
  }

  if ("summaryTriggerTokens" in body) {
    const parsed = parsePositiveInt(
      body.summaryTriggerTokens,
      "trigger token count",
      1,
    );
    if (parsed.error) return parsed;
    fields.summaryTriggerTokens = parsed.value;
  }

  if ("summaryRetainTokens" in body) {
    const parsed = parsePositiveInt(
      body.summaryRetainTokens,
      "retain token count",
      1,
    );
    if (parsed.error) return parsed;
    fields.summaryRetainTokens = parsed.value;
  }

  if ("summaryModelConfigId" in body) {
    const parsed = parseSummaryModelConfigId(body.summaryModelConfigId, allowedIds);
    if (parsed.error) return parsed;
    fields.summaryModelConfigId = parsed.value ?? null;
  }

  const triggerTurns = fields.summaryTriggerTurns;
  const retainTurns = fields.summaryRetainTurns;
  const triggerTokens = fields.summaryTriggerTokens;
  const retainTokens = fields.summaryRetainTokens;

  if (
    triggerTurns != null &&
    retainTurns != null &&
    retainTurns > triggerTurns
  ) {
    return { error: "Retain turns cannot exceed trigger turns" };
  }

  if (
    triggerTokens != null &&
    retainTokens != null &&
    retainTokens > triggerTokens
  ) {
    return { error: "Retain tokens cannot exceed trigger tokens" };
  }

  return { fields };
}
