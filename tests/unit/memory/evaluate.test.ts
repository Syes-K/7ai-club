import { describe, expect, it } from "vitest";
import { evaluateSummarization } from "@/lib/memory/evaluate";
import type { DbMessageWithArchive } from "@/lib/data/types";

function message(
  id: string,
  role: DbMessageWithArchive["role"],
  content: string,
): DbMessageWithArchive {
  return {
    id,
    conversation_id: "conv-1",
    role,
    content,
    created_at: "2026-01-01T00:00:00Z",
    summarized_at: null,
  };
}

const basePrefs = {
  summarization_enabled: true,
  summary_trigger_turns: 2,
  summary_retain_turns: 1,
  summary_trigger_tokens: 100,
  summary_retain_tokens: 40,
  summary_model_config_id: null,
};

describe("evaluateSummarization", () => {
  it("skips when summarization is disabled", () => {
    const activeMessages = [
      message("u1", "user", "Hello"),
      message("a1", "assistant", "Hi"),
      message("u2", "user", "Again"),
      message("a2", "assistant", "Sure"),
    ];

    const plan = evaluateSummarization({
      prefs: { ...basePrefs, summarization_enabled: false },
      summary: null,
      activeMessages,
    });

    expect(plan.shouldSummarize).toBe(false);
    expect(plan.archiveIds).toEqual([]);
  });

  it("skips when neither turn nor token threshold is exceeded", () => {
    const activeMessages = [
      message("u1", "user", "Hi"),
      message("a1", "assistant", "Hello"),
    ];

    const plan = evaluateSummarization({
      prefs: basePrefs,
      summary: null,
      activeMessages,
    });

    expect(plan.shouldSummarize).toBe(false);
  });

  it("summarizes when turn threshold is exceeded", () => {
    const activeMessages = [
      message("u1", "user", "One"),
      message("a1", "assistant", "Two"),
      message("u2", "user", "Three"),
      message("a2", "assistant", "Four"),
      message("u3", "user", "Five"),
      message("a3", "assistant", "Six"),
    ];

    const plan = evaluateSummarization({
      prefs: basePrefs,
      summary: null,
      activeMessages,
    });

    expect(plan.shouldSummarize).toBe(true);
    expect(plan.archiveIds.length).toBeGreaterThan(0);
  });

  it("summarizes when token threshold is exceeded", () => {
    const activeMessages = [
      message("u1", "user", "x".repeat(400)),
      message("a1", "assistant", "y".repeat(400)),
      message("u2", "user", "short"),
      message("a2", "assistant", "short"),
    ];

    const plan = evaluateSummarization({
      prefs: { ...basePrefs, summary_trigger_turns: 20, summary_retain_turns: 1 },
      summary: null,
      activeMessages,
    });

    expect(plan.shouldSummarize).toBe(true);
    expect(plan.archiveIds).toEqual(["u1", "a1"]);
  });
});
