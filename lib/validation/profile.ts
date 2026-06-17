import {
  getModelOptionsForProvider,
  getPublicLlmProviderId,
  isValidModelForProvider,
} from "@/lib/constants/model-options";

export const NICKNAME_MAX_LENGTH = 32;

export function validateNickname(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return `Nickname must be ${NICKNAME_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

export function validatePreferredModel(value: string | null | undefined): string | null {
  if (!value) return null;
  const provider = getPublicLlmProviderId();
  if (!isValidModelForProvider(provider, value)) {
    return "Invalid model";
  }
  return null;
}

export function parseProfilePatch(body: {
  nickname?: unknown;
  preferredModel?: unknown;
}): {
  fields?: { nickname?: string | null; preferredModel?: string | null };
  error?: string;
} {
  const fields: { nickname?: string | null; preferredModel?: string | null } = {};

  if ("nickname" in body) {
    const raw = body.nickname;
    if (raw != null && typeof raw !== "string") {
      return { error: "Invalid nickname" };
    }
    const trimmed = raw?.trim() ?? "";
    const nicknameError = validateNickname(trimmed || null);
    if (nicknameError) return { error: nicknameError };
    fields.nickname = trimmed || null;
  }

  if ("preferredModel" in body) {
    const model = body.preferredModel;
    if (model != null && typeof model !== "string") {
      return { error: "Invalid model" };
    }
    const modelError = validatePreferredModel(model || null);
    if (modelError) return { error: modelError };
    fields.preferredModel = model || null;
  }

  if (!("nickname" in fields) && !("preferredModel" in fields)) {
    return { error: "No fields to update" };
  }

  return { fields };
}

export function getModelOptions() {
  return getModelOptionsForProvider(getPublicLlmProviderId());
}
