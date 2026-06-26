import { describe, expect, it } from "vitest";
import { countCompleteTurns, partitionIntoTurns } from "@/lib/memory/turns";
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

describe("memory turns", () => {
  it("groups consecutive user/assistant pairs into turns", () => {
    const messages = [
      message("u1", "user", "Hello"),
      message("a1", "assistant", "Hi"),
      message("u2", "user", "Again"),
      message("a2", "assistant", "Sure"),
    ];

    const turns = partitionIntoTurns(messages);
    expect(turns).toHaveLength(2);
    expect(turns[0]?.user.id).toBe("u1");
    expect(turns[0]?.assistant.id).toBe("a1");
    expect(turns[1]?.user.id).toBe("u2");
    expect(turns[1]?.assistant.id).toBe("a2");
  });

  it("ignores incomplete trailing user messages", () => {
    const messages = [
      message("u1", "user", "Hello"),
      message("a1", "assistant", "Hi"),
      message("u2", "user", "Pending"),
    ];

    expect(countCompleteTurns(messages)).toBe(1);
    expect(partitionIntoTurns(messages)).toHaveLength(1);
  });

  it("skips malformed sequences until the next valid pair", () => {
    const messages = [
      message("a0", "assistant", "Orphan"),
      message("u1", "user", "Hello"),
      message("a1", "assistant", "Hi"),
    ];

    expect(partitionIntoTurns(messages)).toHaveLength(1);
    expect(partitionIntoTurns(messages)[0]?.user.id).toBe("u1");
  });
});
