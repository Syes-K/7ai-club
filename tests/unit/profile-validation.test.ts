import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLATFORM_DEFAULT_CONFIG_ID } from "@/lib/constants/model-providers";

vi.mock("@/lib/data/browser/profile", () => ({
  getUserProfile: vi.fn(),
  upsertUserProfile: vi.fn(),
}));

vi.mock("@/lib/services/browser/model-configs", () => ({
  listPassedModelOptions: vi.fn().mockResolvedValue([
    { id: PLATFORM_DEFAULT_CONFIG_ID, label: "Bailian — qwen3.6-plus" },
    { id: "cfg-1", label: "DeepSeek — deepseek-chat" },
  ]),
}));

import { upsertUserProfile } from "@/lib/data/browser/profile";
import {
  parseAccountPatch,
  parsePreferencesPatch,
  validateNickname,
} from "@/lib/validation/profile";
import { saveAccount } from "@/lib/services/browser/profile";

describe("profile validation (iter-05)", () => {
  const allowed = new Set([PLATFORM_DEFAULT_CONFIG_ID, "cfg-1"]);

  it("validateNickname rejects overlong nickname", () => {
    expect(validateNickname("x".repeat(33))).toMatch(/32 characters or fewer/);
  });

  it("parseAccountPatch accepts nickname", () => {
    const result = parseAccountPatch({ nickname: "Angela" });
    expect(result.error).toBeUndefined();
    expect(result.fields?.nickname).toBe("Angela");
  });

  it("parsePreferencesPatch accepts platform default sentinel", () => {
    const result = parsePreferencesPatch(
      { preferredModelConfigId: PLATFORM_DEFAULT_CONFIG_ID },
      allowed,
    );
    expect(result.error).toBeUndefined();
    expect(result.fields?.preferredModelConfigId).toBeNull();
  });

  it("parsePreferencesPatch rejects unknown config id", () => {
    const result = parsePreferencesPatch(
      { preferredModelConfigId: "missing" },
      allowed,
    );
    expect(result.error).toBe("Selected model is not available");
  });

  it("parsePreferencesPatch accepts passed config id", () => {
    const result = parsePreferencesPatch(
      { preferredModelConfigId: "cfg-1" },
      allowed,
    );
    expect(result.fields?.preferredModelConfigId).toBe("cfg-1");
  });
});

describe("saveAccount service", () => {
  beforeEach(() => {
    vi.mocked(upsertUserProfile).mockReset();
  });

  it("delegates nickname only", async () => {
    vi.mocked(upsertUserProfile).mockResolvedValue({
      user_id: "user-1",
      nickname: "Angela",
      preferred_model_config_id: null,
    });

    const result = await saveAccount({ nickname: "Angela" });
    expect(upsertUserProfile).toHaveBeenCalledWith({ nickname: "Angela" });
    expect(result).toEqual({ nickname: "Angela" });
  });
});
