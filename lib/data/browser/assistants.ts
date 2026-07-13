import { createClient } from "@/lib/supabase/client";
import type { AssistantRow } from "@/lib/data/types";
import { DataError, throwIfError } from "@/lib/data/errors";
import {
  getAssistantKnowledgeBaseIds,
  setAssistantKnowledgeBases,
} from "@/lib/data/browser/knowledge-bases";

const ASSISTANT_COLUMNS =
  "id, name, icon, opening_message, system_prompt, model, user_id, updated_at, is_platform, enabled";

export async function listUserAssistants(): Promise<AssistantRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assistants")
    .select(ASSISTANT_COLUMNS)
    .not("user_id", "is", null)
    .order("updated_at", { ascending: false });

  throwIfError(error);
  return (data ?? []) as AssistantRow[];
}

export async function listPlatformAssistants(): Promise<AssistantRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assistants")
    .select(ASSISTANT_COLUMNS)
    .eq("is_platform", true)
    .eq("enabled", true)
    .order("updated_at", { ascending: false });

  throwIfError(error);
  return (data ?? []) as AssistantRow[];
}

export async function ensureUserAssistants(): Promise<AssistantRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("ensure_user_assistants");

  throwIfError(error);
  return (data ?? []) as AssistantRow[];
}

export async function createAssistant(row: {
  name: string;
  systemPrompt: string;
  icon: string | null;
  openingMessage: string | null;
  model: string;
}): Promise<AssistantRow> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("assistants")
    .insert({
      name: row.name,
      system_prompt: row.systemPrompt,
      icon: row.icon,
      opening_message: row.openingMessage,
      model: row.model,
      is_default: false,
      user_id: user.id,
    })
    .select(ASSISTANT_COLUMNS)
    .single();

  throwIfError(error);
  if (!data) {
    throw new Error("Failed to create assistant");
  }

  return data as AssistantRow;
}

export async function updateAssistant(
  assistantId: string,
  fields: {
    name?: string;
    systemPrompt?: string;
    icon?: string | null;
    openingMessage?: string | null;
  },
): Promise<AssistantRow> {
  const supabase = createClient();
  const row: Record<string, string | null> = {};

  if (fields.name !== undefined) row.name = fields.name;
  if (fields.systemPrompt !== undefined) row.system_prompt = fields.systemPrompt;
  if (fields.icon !== undefined) row.icon = fields.icon;
  if (fields.openingMessage !== undefined) row.opening_message = fields.openingMessage;

  const { data, error } = await supabase
    .from("assistants")
    .update(row)
    .eq("id", assistantId)
    .select(ASSISTANT_COLUMNS)
    .single();

  throwIfError(error);
  if (!data) {
    throw new Error("Assistant not found");
  }

  return data as AssistantRow;
}

export async function deleteAssistant(assistantId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("delete_assistant", {
    p_assistant_id: assistantId,
  });

  if (error) {
    throw new DataError(error.message, error.code);
  }
}

export async function getAssistantById(
  assistantId: string,
): Promise<AssistantRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assistants")
    .select(ASSISTANT_COLUMNS)
    .eq("id", assistantId)
    .maybeSingle();

  throwIfError(error);
  return data as AssistantRow | null;
}

export async function loadAssistantKnowledgeBaseIds(
  assistantId: string,
): Promise<string[]> {
  return getAssistantKnowledgeBaseIds(assistantId);
}

export async function saveAssistantKnowledgeBaseIds(
  assistantId: string,
  kbIds: string[],
): Promise<void> {
  await setAssistantKnowledgeBases(assistantId, kbIds);
}

export async function getPlatformTemplateModel(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assistants")
    .select("model")
    .is("user_id", null)
    .eq("is_default", true)
    .maybeSingle();

  throwIfError(error);
  return data?.model ?? "Qwen/Qwen2.5-7B-Instruct";
}
