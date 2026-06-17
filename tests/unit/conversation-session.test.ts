import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ConversationSummary } from "@/lib/data/types";

const listMessages = vi.fn();
const getConversationSummaryById = vi.fn();

vi.mock("@/lib/data/browser/messages", () => ({
  listMessages: (...args: unknown[]) => listMessages(...args),
}));

vi.mock("@/lib/data/browser/conversations", () => ({
  listConversations: vi.fn(),
  getConversationSummaryById: (...args: unknown[]) =>
    getConversationSummaryById(...args),
  deleteConversation: vi.fn(),
  createConversationWithOpening: vi.fn(),
}));

vi.mock("@/lib/services/browser/model-label", () => ({
  getDisplayModelLabel: () => "qwen3.6-plus (bailian)",
}));

import { loadConversationSession } from "@/lib/services/browser/conversation-session";

const summary: ConversationSummary = {
  id: "conv-1",
  title: "Test chat",
  updated_at: "2026-06-16T00:00:00.000Z",
  assistant_name: "7ai Assistant",
  assistant_icon: null,
  assistant_model: "qwen3.6-plus",
};

describe("AC-30 loadConversationSession", () => {
  beforeEach(() => {
    listMessages.mockReset();
    getConversationSummaryById.mockReset();
    listMessages.mockResolvedValue([]);
  });

  it("uses sidebar summary and only fetches messages (no session BFF path)", async () => {
    await loadConversationSession("conv-1", {
      summary,
      preferredModel: "qwen-plus",
    });

    expect(listMessages).toHaveBeenCalledOnce();
    expect(listMessages).toHaveBeenCalledWith("conv-1");
    expect(getConversationSummaryById).not.toHaveBeenCalled();
  });

  it("cold load fetches messages and conversation summary in parallel", async () => {
    getConversationSummaryById.mockResolvedValue(summary);

    await loadConversationSession("conv-1", { preferredModel: null });

    expect(listMessages).toHaveBeenCalledWith("conv-1");
    expect(getConversationSummaryById).toHaveBeenCalledWith("conv-1");
  });

  it("ignores summary when conversation id does not match", async () => {
    getConversationSummaryById.mockResolvedValue(summary);

    await loadConversationSession("conv-1", {
      summary: { ...summary, id: "conv-other" },
    });

    expect(getConversationSummaryById).toHaveBeenCalledWith("conv-1");
  });
});
