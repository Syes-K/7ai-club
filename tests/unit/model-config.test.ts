import { describe, expect, it } from "vitest";
import {
  buildEmbeddingModelOptionsFromDtos,
  mergeUserAndPlatformModels,
  resolvePreferenceLabel,
  rowToModelConfigDto,
  toPassedModelOptions,
} from "@/lib/console/model-configs";
import { platformRowToDto } from "@/lib/platform/model-configs";
import type { ModelConfigRow } from "@/lib/data/types";

const sampleRow: ModelConfigRow = {
  id: "cfg-1",
  user_id: "user-1",
  provider: "deepseek",
  model_name: "deepseek-chat",
  model_type: "chat",
  embedding_dimensions: null,
  test_status: "passed",
  tested_at: null,
  test_error: null,
  api_key_set: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const platformDto = platformRowToDto({
  id: "platform-1",
  display_name: "Platform Bailian",
  provider: "bailian",
  model_name: "qwen3.7-max-2026-06-08",
  model_type: "chat",
  embedding_dimensions: null,
  enabled: true,
  sort_order: 0,
  test_status: "passed",
  tested_at: null,
  test_error: null,
  api_key_set: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

describe("model config helpers", () => {
  it("mergeUserAndPlatformModels prepends platform rows", () => {
    const configs = mergeUserAndPlatformModels(
      [rowToModelConfigDto(sampleRow)],
      [platformDto],
    );
    expect(configs[0]?.isPlatformDefault).toBe(true);
    expect(configs[0]?.id).toBe("platform-1");
    expect(configs[1]?.id).toBe("cfg-1");
  });

  it("toPassedModelOptions filters untested configs", () => {
    const configs = mergeUserAndPlatformModels(
      [
        rowToModelConfigDto(sampleRow),
        rowToModelConfigDto({
          ...sampleRow,
          id: "cfg-2",
          test_status: "untested",
        }),
      ],
      [platformDto],
    );
    const options = toPassedModelOptions(configs);
    expect(options.map((option) => option.id)).toEqual(["platform-1", "cfg-1"]);
    expect(options[0]?.isPlatform).toBe(true);
    expect(options[0]?.label).toBe(
      "Platform — Bailian — qwen3.7-max-2026-06-08",
    );
    expect(options[1]?.isPlatform).toBe(false);
  });

  it("resolvePreferenceLabel uses first option when preference null", () => {
    const options = toPassedModelOptions(
      mergeUserAndPlatformModels([], [platformDto]),
    );
    expect(resolvePreferenceLabel(null, options)).toBe(
      "Platform — Bailian — qwen3.7-max-2026-06-08",
    );
  });

  it("buildEmbeddingModelOptionsFromDtos merges passed platform embedding rows", () => {
    const platformEmbedding = platformRowToDto({
      id: "platform-embed-1",
      display_name: "Platform BGE-M3",
      provider: "siliconflow",
      model_name: "BAAI/bge-m3",
      model_type: "embedding",
      embedding_dimensions: 1024,
      enabled: true,
      sort_order: 0,
      test_status: "passed",
      tested_at: null,
      test_error: null,
      api_key_set: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    const userEmbedding = rowToModelConfigDto({
      ...sampleRow,
      id: "embed-1",
      model_type: "embedding",
      model_name: "custom-embed",
      embedding_dimensions: 768,
    });

    const options = buildEmbeddingModelOptionsFromDtos(
      [platformEmbedding],
      [userEmbedding],
    );

    expect(options).toHaveLength(2);
    expect(options[0]?.label).toBe("Platform — SiliconFlow — BAAI/bge-m3");
    expect(options[0]?.isPlatformDefault).toBe(true);
    expect(options[1]?.model).toBe("custom-embed");
  });
});
