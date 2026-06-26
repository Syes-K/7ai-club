import { describe, expect, it } from "vitest";
import { selectArchiveMessageIds } from "@/lib/memory/select-archive";
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

function buildTurns(count: number): DbMessageWithArchive[] {
  const messages: DbMessageWithArchive[] = [];

  for (let index = 0; index < count; index += 1) {
    messages.push(
      message(`u${index}`, "user", `User message ${index}`),
      message(`a${index}`, "assistant", `Assistant reply ${index}`),
    );
  }

  return messages;
}

const prefs = {
  summarization_enabled: true,
  summary_trigger_turns: 20,
  summary_retain_turns: 2,
  summary_trigger_tokens: 8000,
  summary_retain_tokens: 40,
  summary_model_config_id: null,
};

describe("selectArchiveMessageIds", () => {
  it("archives oldest turns beyond retain count", () => {
    const activeMessages = buildTurns(4);
    const archiveIds = selectArchiveMessageIds(activeMessages, prefs, null);

    expect(archiveIds).toEqual(["u0", "a0", "u1", "a1"]);
  });

  it("moves whole turns when retain token budget is exceeded", () => {
    const activeMessages = [
      message("u0", "user", "x".repeat(200)),
      message("a0", "assistant", "y".repeat(200)),
      message("u1", "user", "short"),
      message("a1", "assistant", "short"),
    ];

    const archiveIds = selectArchiveMessageIds(activeMessages, prefs, null);

    expect(archiveIds).toEqual(["u0", "a0"]);
  });

  it("returns empty when there are no complete turns", () => {
    const archiveIds = selectArchiveMessageIds(
      [message("u0", "user", "Pending")],
      prefs,
      null,
    );

    expect(archiveIds).toEqual([]);
  });
});
