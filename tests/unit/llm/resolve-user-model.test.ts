import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveUserModelForChat } from "@/lib/llm/resolve-user-model";

const fallbackModel = {
  configId: "platform-kimi",
  provider: "bailian" as const,
  modelName: "kimi-k2.7-code",
  apiKey: "sk-test",
  label: "Platform — Bailian — kimi-k2.7-code",
};

vi.mock("@/lib/platform/resolve", () => ({
  resolvePlatformModelById: vi.fn(),
  resolveDefaultPlatformChatModel: vi.fn(),
}));

import {
  resolveDefaultPlatformChatModel,
  resolvePlatformModelById,
} from "@/lib/platform/resolve";

function mockSupabase(userRow: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: userRow, error: null }),
    }),
  };
}

describe("resolveUserModelForChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to default platform chat when preferred platform model is disabled", async () => {
    vi.mocked(resolvePlatformModelById).mockResolvedValue(null);
    vi.mocked(resolveDefaultPlatformChatModel).mockResolvedValue(fallbackModel);

    const supabase = mockSupabase(null);
    const resolved = await resolveUserModelForChat(
      "user-1",
      "platform-qwen-disabled",
      supabase as never,
    );

    expect(resolved).toEqual(fallbackModel);
    expect(resolvePlatformModelById).toHaveBeenCalledWith(
      "platform-qwen-disabled",
      supabase,
    );
    expect(resolveDefaultPlatformChatModel).toHaveBeenCalledWith(supabase);
  });

  it("uses resolved platform model when preferred id is still available", async () => {
    const platformModel = {
      configId: "platform-qwen",
      provider: "bailian" as const,
      modelName: "qwen3.7-max-2026-06-08",
      apiKey: "sk-test",
      label: "Platform — Bailian — qwen3.7-max-2026-06-08",
    };

    vi.mocked(resolvePlatformModelById).mockResolvedValue(platformModel);
    vi.mocked(resolveDefaultPlatformChatModel).mockResolvedValue(fallbackModel);

    const supabase = mockSupabase(null);
    const resolved = await resolveUserModelForChat(
      "user-1",
      "platform-qwen",
      supabase as never,
    );

    expect(resolved).toEqual(platformModel);
    expect(resolveDefaultPlatformChatModel).not.toHaveBeenCalled();
  });
});
