import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { findTurnAssistantMessage } from "@/lib/chat/turn-assistant";

function msg(id: string, role: UIMessage["role"], text: string): UIMessage {
  return { id, role, parts: [{ type: "text", text }] };
}

describe("findTurnAssistantMessage", () => {
  it("returns assistant after the latest user message", () => {
    const messages = [
      msg("u1", "user", "hello"),
      msg("a1", "assistant", "hi"),
      msg("u2", "user", "again"),
      msg("a2", "assistant", ""),
    ];

    expect(findTurnAssistantMessage(messages)?.id).toBe("a2");
  });

  it("returns undefined when no assistant follows the latest user message", () => {
    const messages = [
      msg("a0", "assistant", ""),
      msg("u1", "user", "hello"),
    ];

    expect(findTurnAssistantMessage(messages)).toBeUndefined();
  });

  it("ignores empty assistant placeholders before the latest user message", () => {
    const messages = [
      msg("a0", "assistant", ""),
      msg("u1", "user", "hello"),
      msg("a1", "assistant", "reply"),
    ];

    expect(findTurnAssistantMessage(messages)?.id).toBe("a1");
  });
});
