import { describe, expect, it } from "vitest";
import {
  ASSISTANT_NAME_MAX_LENGTH,
  normalizeAssistantIcon,
  parseAssistantFormBody,
  validateAssistantCreate,
  validateAssistantIcon,
} from "@/lib/validation/assistant";

describe("assistant validation", () => {
  it("AC-32: normalizeAssistantIcon returns null for blank input", () => {
    expect(normalizeAssistantIcon("   ")).toBeNull();
    expect(normalizeAssistantIcon(undefined)).toBeNull();
  });

  it("AC-32: validateAssistantIcon rejects overlong icon", () => {
    const longIcon = "a".repeat(17);
    expect(validateAssistantIcon(longIcon)).toMatch(/16 characters or fewer/);
  });

  it("AC-32: validateAssistantCreate requires name and system prompt", () => {
    expect(
      validateAssistantCreate({
        icon: null,
        name: "",
        openingMessage: null,
        systemPrompt: "You are helpful.",
      }),
    ).toBe("Invalid name");

    expect(
      validateAssistantCreate({
        icon: null,
        name: "Test Assistant",
        openingMessage: null,
        systemPrompt: "   ",
      }),
    ).toBe("System prompt is required");
  });

  it("AC-32: parseAssistantFormBody rejects invalid name length", () => {
    const result = parseAssistantFormBody({
      name: "x".repeat(ASSISTANT_NAME_MAX_LENGTH + 1),
    });
    expect(result.error).toBe("Invalid name");
  });
});
