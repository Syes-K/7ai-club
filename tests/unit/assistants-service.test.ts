import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssistantRow } from "@/lib/data/types";

const ensureUserAssistants = vi.fn();
const createAssistant = vi.fn();
const getPlatformTemplateModel = vi.fn();
const deleteAssistant = vi.fn();

const saveAssistantKnowledgeBaseIds = vi.fn();

vi.mock("@/lib/data/browser/assistants", () => ({
  ensureUserAssistants: (...args: unknown[]) => ensureUserAssistants(...args),
  createAssistant: (...args: unknown[]) => createAssistant(...args),
  updateAssistant: vi.fn(),
  deleteAssistant: (...args: unknown[]) => deleteAssistant(...args),
  getPlatformTemplateModel: (...args: unknown[]) =>
    getPlatformTemplateModel(...args),
  listUserAssistants: vi.fn(),
  getAssistantById: vi.fn(),
  loadAssistantKnowledgeBaseIds: vi.fn().mockResolvedValue([]),
  saveAssistantKnowledgeBaseIds: (...args: unknown[]) =>
    saveAssistantKnowledgeBaseIds(...args),
}));

import {
  createUserAssistant,
  deleteUserAssistant,
  listAssistants,
} from "@/lib/services/browser/assistants";

const assistantRow: AssistantRow = {
  id: "asst-1",
  name: "Helper",
  icon: "🤖",
  opening_message: "Hello",
  system_prompt: "You are helpful.",
  model: "qwen3.6-plus",
  user_id: "user-1",
  updated_at: "2026-06-16T00:00:00.000Z",
};

describe("AC-32 assistants browser layer", () => {
  beforeEach(() => {
    ensureUserAssistants.mockReset();
    createAssistant.mockReset();
    getPlatformTemplateModel.mockReset();
    saveAssistantKnowledgeBaseIds.mockReset();
    saveAssistantKnowledgeBaseIds.mockResolvedValue(undefined);
    getPlatformTemplateModel.mockResolvedValue("qwen3.6-plus");
  });

  it("listAssistants reads via ensureUserAssistants RPC path", async () => {
    ensureUserAssistants.mockResolvedValue([assistantRow]);

    const result = await listAssistants();

    expect(ensureUserAssistants).toHaveBeenCalledOnce();
    expect(result[0]?.name).toBe("Helper");
    expect(result[0]?.openingMessage).toBe("Hello");
  });

  it("createUserAssistant validates then inserts via data layer", async () => {
    createAssistant.mockResolvedValue(assistantRow);

    const result = await createUserAssistant({
      icon: "🤖",
      name: "Helper",
      openingMessage: "Hello",
      systemPrompt: "You are helpful.",
    });

    expect(createAssistant).toHaveBeenCalledWith({
      name: "Helper",
      systemPrompt: "You are helpful.",
      icon: "🤖",
      openingMessage: "Hello",
      model: "qwen3.6-plus",
    });
    expect(result.id).toBe("asst-1");
  });

  it("createUserAssistant rejects invalid payload before data call", async () => {
    await expect(
      createUserAssistant({
        icon: null,
        name: "",
        openingMessage: null,
        systemPrompt: "You are helpful.",
      }),
    ).rejects.toThrow("Invalid name");

    expect(createAssistant).not.toHaveBeenCalled();
  });

  it("deleteUserAssistant maps RPC errors from data layer", async () => {
    const { DataError } = await import("@/lib/data/errors");
    deleteAssistant.mockRejectedValue(
      new DataError("assistant_in_use:2", "P0001"),
    );

    await expect(deleteUserAssistant("asst-1")).rejects.toThrow(/2 chat\(s\)/);
  });
});
