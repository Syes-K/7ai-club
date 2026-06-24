import {
  normalizePreferredConfigId,
  PLATFORM_DEFAULT_CONFIG_ID,
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

export function parsePreferencesPatch(
  body: { preferredModelConfigId?: unknown },
  allowedIds: Set<string>,
): {
  fields?: { preferredModelConfigId: string | null };
  error?: string;
} {
  if (!("preferredModelConfigId" in body)) {
    return { error: "No fields to update" };
  }

  const raw = body.preferredModelConfigId;

  if (raw == null || raw === "") {
    return { fields: { preferredModelConfigId: null } };
  }

  if (typeof raw !== "string") {
    return { error: "Invalid model preference" };
  }

  if (raw === PLATFORM_DEFAULT_CONFIG_ID) {
    return { fields: { preferredModelConfigId: null } };
  }

  if (!allowedIds.has(raw)) {
    return { error: "Selected model is not available" };
  }

  return {
    fields: { preferredModelConfigId: normalizePreferredConfigId(raw) },
  };
}
