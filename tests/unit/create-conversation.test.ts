import { beforeEach, describe, expect, it, vi } from "vitest";

const createConversationWithOpening = vi.fn();

vi.mock("@/lib/data/browser/conversations", () => ({
  listConversations: vi.fn(),
  getConversationSummaryById: vi.fn(),
  deleteConversation: vi.fn(),
  createConversationWithOpening: (...args: unknown[]) =>
    createConversationWithOpening(...args),
}));

vi.mock("@/lib/data/browser/messages", () => ({
  listMessages: vi.fn(),
}));

vi.mock("@/lib/services/browser/model-label", () => ({
  getDisplayModelLabel: () => "qwen3.6-plus (bailian)",
}));

import { createConversation } from "@/lib/services/browser/conversation-session";

describe("AC-33 create conversation with opening via RPC", () => {
  beforeEach(() => {
    createConversationWithOpening.mockReset();
  });

  it("delegates to create_conversation_with_opening RPC wrapper", async () => {
    createConversationWithOpening.mockResolvedValue("conv-new");

    const id = await createConversation("asst-1");

    expect(createConversationWithOpening).toHaveBeenCalledWith("asst-1");
    expect(id).toBe("conv-new");
  });

  it("surfaces data layer failures", async () => {
    createConversationWithOpening.mockRejectedValue(
      new Error("Assistant not found"),
    );

    await expect(createConversation("missing")).rejects.toThrow(
      "Assistant not found",
    );
  });
});
