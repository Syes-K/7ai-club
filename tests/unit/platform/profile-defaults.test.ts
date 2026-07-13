import { describe, expect, it, vi } from "vitest";
import {
  fetchDefaultPlatformChatModelId,
  fetchDefaultPlatformEmbedding,
} from "@/lib/platform/profile-defaults";

function mockSupabase(rows: Record<string, unknown>[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: rows[0] ?? null,
      error: null,
    }),
  };
  return {
    from: vi.fn().mockReturnValue(chain),
    _chain: chain,
  };
}

describe("profile-defaults", () => {
  it("fetchDefaultPlatformChatModelId returns first passed chat row", async () => {
    const supabase = mockSupabase([
      {
        id: "chat-1",
        provider: "bailian",
        model_name: "qwen3.7-max-2026-06-08",
      },
    ]);

    await expect(
      fetchDefaultPlatformChatModelId(supabase as never),
    ).resolves.toBe("chat-1");

    expect(supabase.from).toHaveBeenCalledWith("platform_model_configs");
    expect(supabase._chain.eq).toHaveBeenCalledWith("model_type", "chat");
  });

  it("fetchDefaultPlatformEmbedding returns provider and model", async () => {
    const supabase = mockSupabase([
      {
        id: "embed-1",
        provider: "siliconflow",
        model_name: "BAAI/bge-m3",
      },
    ]);

    await expect(
      fetchDefaultPlatformEmbedding(supabase as never),
    ).resolves.toEqual({
      provider: "siliconflow",
      model: "BAAI/bge-m3",
    });

    expect(supabase._chain.eq).toHaveBeenCalledWith("model_type", "embedding");
  });
});
