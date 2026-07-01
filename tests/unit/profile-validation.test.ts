import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PLATFORM_DEFAULT_CONFIG_ID,
  SUMMARY_SAME_AS_CHAT_ID,
} from "@/lib/constants/model-providers";

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
import { saveAccount, savePreferences } from "@/lib/services/browser/profile";

const allowedEmbeddingKeys = new Set(["siliconflow:BAAI/bge-m3"]);

vi.mock("@/lib/services/browser/embedding-models", () => ({
  listEmbeddingModelOptions: vi.fn().mockResolvedValue([
    {
      key: "siliconflow:BAAI/bge-m3",
      provider: "siliconflow",
      model: "BAAI/bge-m3",
      label: "Platform default — siliconflow — BAAI/bge-m3",
      dimensions: 1024,
      isPlatformDefault: true,
    },
  ]),
  buildAllowedEmbeddingKeys: vi.fn().mockReturnValue(
    new Set(["siliconflow:BAAI/bge-m3"]),
  ),
}));

const mockProfile = {
  user_id: "user-1",
  nickname: "Angela",
  preferred_model_config_id: null,
  summarization_enabled: true,
  summary_trigger_turns: 20,
  summary_retain_turns: 4,
  summary_trigger_tokens: 8000,
  summary_retain_tokens: 2000,
  summary_model_config_id: null,
};

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
      allowedEmbeddingKeys,
    );
    expect(result.error).toBeUndefined();
    expect(result.fields?.preferredModelConfigId).toBeNull();
  });

  it("parsePreferencesPatch rejects unknown config id", () => {
    const result = parsePreferencesPatch(
      { preferredModelConfigId: "missing" },
      allowed,
      allowedEmbeddingKeys,
    );
    expect(result.error).toBe("Selected model is not available");
  });

  it("parsePreferencesPatch accepts passed config id", () => {
    const result = parsePreferencesPatch(
      { preferredModelConfigId: "cfg-1" },
      allowed,
      allowedEmbeddingKeys,
    );
    expect(result.fields?.preferredModelConfigId).toBe("cfg-1");
  });
});

describe("profile validation (iter-07 memory)", () => {
  const allowed = new Set([PLATFORM_DEFAULT_CONFIG_ID, "cfg-1"]);

  it("parsePreferencesPatch accepts memory fields", () => {
    const result = parsePreferencesPatch(
      {
        summarizationEnabled: true,
        summaryTriggerTurns: 20,
        summaryRetainTurns: 4,
        summaryTriggerTokens: 8000,
        summaryRetainTokens: 2000,
        summaryModelConfigId: SUMMARY_SAME_AS_CHAT_ID,
      },
      allowed,
      allowedEmbeddingKeys,
    );

    expect(result.error).toBeUndefined();
    expect(result.fields?.summaryModelConfigId).toBeNull();
  });

  it("parsePreferencesPatch rejects retain turns above trigger turns", () => {
    const result = parsePreferencesPatch(
      {
        summaryTriggerTurns: 6,
        summaryRetainTurns: 8,
      },
      allowed,
      allowedEmbeddingKeys,
    );

    expect(result.error).toBe("Retain turns cannot exceed trigger turns");
  });

  it("parsePreferencesPatch rejects retain tokens above trigger tokens", () => {
    const result = parsePreferencesPatch(
      {
        summaryTriggerTokens: 1000,
        summaryRetainTokens: 2000,
      },
      allowed,
      allowedEmbeddingKeys,
    );

    expect(result.error).toBe("Retain tokens cannot exceed trigger tokens");
  });
});

describe("profile validation (iter-09 RAG preferences)", () => {
  const allowed = new Set([PLATFORM_DEFAULT_CONFIG_ID, "cfg-1"]);
  const allowedEmbeddingKeys = new Set(["siliconflow:BAAI/bge-m3"]);

  it("AC-94: parsePreferencesPatch accepts RAG confidence and TopK", () => {
    const result = parsePreferencesPatch(
      { ragConfidenceThreshold: 0.65, ragTopK: 3 },
      allowed,
      allowedEmbeddingKeys,
    );

    expect(result.error).toBeUndefined();
    expect(result.fields?.ragConfidenceThreshold).toBe(0.65);
    expect(result.fields?.ragTopK).toBe(3);
  });

  it("AC-94: parsePreferencesPatch rejects invalid confidence", () => {
    const result = parsePreferencesPatch(
      { ragConfidenceThreshold: 1.5 },
      allowed,
      allowedEmbeddingKeys,
    );

    expect(result.error).toBe("Confidence threshold must be between 0 and 1");
  });

  it("AC-94: parsePreferencesPatch requires embedding provider and model together", () => {
    const result = parsePreferencesPatch(
      { ragEmbeddingProvider: "siliconflow" },
      allowed,
      allowedEmbeddingKeys,
    );

    expect(result.error).toBe(
      "Embedding model provider and model are required together",
    );
  });

  it("AC-94: parsePreferencesPatch accepts whitelisted embedding model", () => {
    const result = parsePreferencesPatch(
      {
        ragEmbeddingProvider: "siliconflow",
        ragEmbeddingModel: "BAAI/bge-m3",
      },
      allowed,
      allowedEmbeddingKeys,
    );

    expect(result.error).toBeUndefined();
    expect(result.fields?.ragEmbeddingProvider).toBe("siliconflow");
    expect(result.fields?.ragEmbeddingModel).toBe("BAAI/bge-m3");
  });
});

describe("saveAccount service", () => {
  beforeEach(() => {
    vi.mocked(upsertUserProfile).mockReset();
  });

  it("delegates nickname only", async () => {
    vi.mocked(upsertUserProfile).mockResolvedValue(mockProfile);

    const result = await saveAccount({ nickname: "Angela" });
    expect(upsertUserProfile).toHaveBeenCalledWith({ nickname: "Angela" });
    expect(result).toEqual({ nickname: "Angela" });
  });
});

describe("savePreferences service", () => {
  beforeEach(() => {
    vi.mocked(upsertUserProfile).mockReset();
  });

  it("delegates memory fields", async () => {
    vi.mocked(upsertUserProfile).mockResolvedValue(mockProfile);

    await savePreferences({
      summarizationEnabled: false,
      summaryTriggerTurns: 10,
      summaryRetainTurns: 4,
      summaryTriggerTokens: 5000,
      summaryRetainTokens: 2000,
      summaryModelConfigId: "cfg-1",
    });

    expect(upsertUserProfile).toHaveBeenCalledWith({
      preferredModelConfigId: undefined,
      summarizationEnabled: false,
      summaryTriggerTurns: 10,
      summaryRetainTurns: 4,
      summaryTriggerTokens: 5000,
      summaryRetainTokens: 2000,
      summaryModelConfigId: "cfg-1",
    });
  });
});
