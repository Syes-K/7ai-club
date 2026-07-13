import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLATFORM_DEFAULT_MODEL_NAME } from "@/lib/constants/model-providers";
import type { AssistantRow } from "@/lib/data/types";

const listUserAssistants = vi.fn();
const listPlatformAssistants = vi.fn();
const createAssistant = vi.fn();
const deleteAssistant = vi.fn();

const saveAssistantKnowledgeBaseIds = vi.fn();

vi.mock("@/lib/data/browser/assistants", () => ({
  ensureUserAssistants: vi.fn(),
  createAssistant: (...args: unknown[]) => createAssistant(...args),
  updateAssistant: vi.fn(),
  deleteAssistant: (...args: unknown[]) => deleteAssistant(...args),
  getPlatformTemplateModel: vi.fn(),
  listUserAssistants: (...args: unknown[]) => listUserAssistants(...args),
  listPlatformAssistants: (...args: unknown[]) => listPlatformAssistants(...args),
  getAssistantById: vi.fn(),
  loadAssistantKnowledgeBaseIds: vi.fn().mockResolvedValue([]),
  saveAssistantKnowledgeBaseIds: (...args: unknown[]) =>
    saveAssistantKnowledgeBaseIds(...args),
}));

import {
  createUserAssistant,
  deleteUserAssistant,
  listAssistants,
  listAssistantOptions,
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
    listUserAssistants.mockReset();
    listPlatformAssistants.mockReset();
    createAssistant.mockReset();
    saveAssistantKnowledgeBaseIds.mockReset();
    saveAssistantKnowledgeBaseIds.mockResolvedValue(undefined);
  });

  it("listAssistants reads personal assistants only", async () => {
    listUserAssistants.mockResolvedValue([assistantRow]);

    const result = await listAssistants();

    expect(listUserAssistants).toHaveBeenCalledOnce();
    expect(result[0]?.name).toBe("Helper");
    expect(result[0]?.openingMessage).toBe("Hello");
  });

  it("listAssistantOptions aggregates personal then platform (AC-138)", async () => {
    listUserAssistants.mockResolvedValue([assistantRow]);
    listPlatformAssistants.mockResolvedValue([
      { ...assistantRow, id: "plat-1", name: "System", user_id: null },
    ]);

    const result = await listAssistantOptions();

    expect(result.map((r) => r.id)).toEqual(["asst-1", "plat-1"]);
    expect(result[1]?.isPlatform).toBe(true);
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
      model: PLATFORM_DEFAULT_MODEL_NAME,
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
