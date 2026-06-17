import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_LLM_PROVIDER", "bailian");

import { parseProfilePatch, validateNickname } from "@/lib/validation/profile";
import { saveProfile } from "@/lib/services/browser/profile";

const upsertUserProfile = vi.fn();

vi.mock("@/lib/data/browser/profile", () => ({
  getUserProfile: vi.fn(),
  upsertUserProfile: (...args: unknown[]) => upsertUserProfile(...args),
}));

describe("AC-31 profile browser layer", () => {
  beforeEach(() => {
    upsertUserProfile.mockReset();
  });

  it("validateNickname rejects overlong nickname", () => {
    expect(validateNickname("x".repeat(33))).toMatch(/32 characters or fewer/);
  });

  it("parseProfilePatch accepts valid bailian model", () => {
    const result = parseProfilePatch({ preferredModel: "qwen-plus" });
    expect(result.error).toBeUndefined();
    expect(result.fields?.preferredModel).toBe("qwen-plus");
  });

  it("parseProfilePatch rejects invalid model for provider", () => {
    const result = parseProfilePatch({ preferredModel: "not-a-real-model" });
    expect(result.error).toBe("Invalid model");
  });

  it("saveProfile delegates to data layer after validation", async () => {
    upsertUserProfile.mockResolvedValue({
      user_id: "user-1",
      nickname: "Angela",
      preferred_model: "qwen-turbo",
    });

    const result = await saveProfile({
      nickname: "Angela",
      preferredModel: "qwen-turbo",
    });

    expect(upsertUserProfile).toHaveBeenCalledWith({
      nickname: "Angela",
      preferredModel: "qwen-turbo",
    });
    expect(result).toEqual({
      nickname: "Angela",
      preferredModel: "qwen-turbo",
    });
  });
});
