import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { shouldResumeChatStream } from "@/lib/chat/stream-resume";

function msg(id: string, role: UIMessage["role"], text: string): UIMessage {
  return { id, role, parts: [{ type: "text", text }] };
}

describe("shouldResumeChatStream", () => {
  it("returns true when the last message is from the user", () => {
    const messages = [msg("u1", "user", "hello")];
    expect(shouldResumeChatStream(messages)).toBe(true);
  });

  it("returns false when the last message is an assistant reply", () => {
    const messages = [
      msg("u1", "user", "hello"),
      msg("a1", "assistant", "hi"),
    ];
    expect(shouldResumeChatStream(messages)).toBe(false);
  });

  it("returns false for an empty conversation", () => {
    expect(shouldResumeChatStream([])).toBe(false);
  });
});
