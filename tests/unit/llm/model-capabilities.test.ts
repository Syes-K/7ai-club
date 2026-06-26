import { describe, expect, it } from "vitest";
import {
  getStreamTextProviderOptions,
  supportsReasoning,
} from "@/lib/llm/model-capabilities";
import type { ResolvedUserModel } from "@/lib/llm/provider";

function model(
  provider: ResolvedUserModel["provider"],
  modelName: string,
): ResolvedUserModel {
  return {
    configId: "cfg-1",
    provider,
    modelName,
    apiKey: "sk-test",
    label: `${provider} — ${modelName}`,
  };
}

describe("supportsReasoning", () => {
  it("matches Bailian Qwen3 and DeepSeek thinking models", () => {
    expect(supportsReasoning(model("bailian", "qwen3.6-plus"))).toBe(true);
    expect(supportsReasoning(model("bailian", "qwen3.7-plus-2026-05-26"))).toBe(
      true,
    );
    expect(supportsReasoning(model("bailian", "deepseek-v4-pro"))).toBe(true);
  });

  it("matches DeepSeek official V4 models", () => {
    expect(supportsReasoning(model("deepseek", "deepseek-v4-pro"))).toBe(true);
  });

  it("does not match non-reasoning providers or models", () => {
    expect(supportsReasoning(model("openai", "gpt-4o-mini"))).toBe(false);
    expect(supportsReasoning(model("bailian", "qwen-plus"))).toBe(false);
    expect(supportsReasoning(model("deepseek", "deepseek-chat"))).toBe(false);
  });
});

describe("getStreamTextProviderOptions", () => {
  it("uses resolved Bailian provider key and enables thinking for Qwen3", () => {
    expect(getStreamTextProviderOptions(model("bailian", "qwen3.6-plus"))).toEqual({
      bailian: { enable_thinking: true },
    });
  });

  it("disables thinking for non-reasoning Bailian models", () => {
    expect(getStreamTextProviderOptions(model("bailian", "qwen-plus"))).toEqual({
      bailian: { enable_thinking: false },
    });
  });

  it("uses resolved DeepSeek provider key for V4 models", () => {
    expect(getStreamTextProviderOptions(model("deepseek", "deepseek-v4-pro"))).toEqual({
      deepseek: { thinking: { type: "enabled" } },
    });
  });

  it("returns undefined for providers without thinking toggles", () => {
    expect(getStreamTextProviderOptions(model("openai", "gpt-4o-mini"))).toBeUndefined();
  });
});
