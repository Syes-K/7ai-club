import { describe, expect, it } from "vitest";
import {
  mergePlatformDefault,
  resolvePreferenceLabel,
  toPassedModelOptions,
} from "@/lib/console/model-configs";
import { PLATFORM_DEFAULT_CONFIG_ID } from "@/lib/constants/model-providers";
import type { ModelConfigRow } from "@/lib/data/types";

const sampleRow: ModelConfigRow = {
  id: "cfg-1",
  user_id: "user-1",
  provider: "deepseek",
  model_name: "deepseek-chat",
  test_status: "passed",
  tested_at: null,
  test_error: null,
  api_key_set: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("model config helpers", () => {
  it("mergePlatformDefault prepends virtual platform row", () => {
    const configs = mergePlatformDefault([sampleRow]);
    expect(configs[0]?.isPlatformDefault).toBe(true);
    expect(configs[0]?.id).toBe(PLATFORM_DEFAULT_CONFIG_ID);
    expect(configs[1]?.id).toBe("cfg-1");
  });

  it("toPassedModelOptions filters untested configs", () => {
    const configs = mergePlatformDefault([
      sampleRow,
      { ...sampleRow, id: "cfg-2", test_status: "untested" },
    ]);
    const options = toPassedModelOptions(configs);
    expect(options.map((option) => option.id)).toEqual([
      PLATFORM_DEFAULT_CONFIG_ID,
      "cfg-1",
    ]);
  });

  it("resolvePreferenceLabel falls back to platform default label", () => {
    const options = toPassedModelOptions(mergePlatformDefault([]));
    expect(resolvePreferenceLabel(null, options)).toBe(
      "Bailian — qwen3.6-plus",
    );
  });
});
