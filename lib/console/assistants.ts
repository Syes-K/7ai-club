import { createClient } from "@/lib/supabase/server";

import type { AssistantRow } from "@/lib/data/types";

const ASSISTANT_COLUMNS =
  "id, name, icon, opening_message, system_prompt, model, user_id, updated_at";

export async function listUserAssistants(userId: string): Promise<AssistantRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assistants")
    .select(ASSISTANT_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AssistantRow[];
}

async function getPlatformTemplate() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assistants")
    .select("name, icon, opening_message, system_prompt, model")
    .is("user_id", null)
    .eq("is_default", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Platform assistant template not found. Run Supabase migrations.",
    );
  }

  return data;
}

export async function ensureUserAssistants(userId: string): Promise<AssistantRow[]> {
  const existing = await listUserAssistants(userId);
  if (existing.length > 0) {
    return existing;
  }

  const template = await getPlatformTemplate();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assistants")
    .insert({
      user_id: userId,
      name: template.name,
      icon: template.icon,
      opening_message: template.opening_message,
      system_prompt: template.system_prompt,
      model: template.model,
      is_default: false,
    })
    .select(ASSISTANT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to seed assistant");
  }

  return [data as AssistantRow];
}

export type CreateAssistantInput = {
  name: string;
  systemPrompt: string;
  icon?: string | null;
  openingMessage?: string | null;
};

export async function createUserAssistant(
  userId: string,
  input: CreateAssistantInput,
): Promise<AssistantRow> {
  const supabase = await createClient();
  const template = await getPlatformTemplate().catch(() => null);

  const { data, error } = await supabase
    .from("assistants")
    .insert({
      user_id: userId,
      name: input.name,
      icon: input.icon ?? null,
      opening_message: input.openingMessage ?? null,
      system_prompt: input.systemPrompt,
      model: template?.model ?? "Qwen/Qwen2.5-7B-Instruct",
      is_default: false,
    })
    .select(ASSISTANT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create assistant");
  }

  return data as AssistantRow;
}

export type UpdateAssistantInput = {
  name?: string;
  systemPrompt?: string;
  icon?: string | null;
  openingMessage?: string | null;
};

export async function updateUserAssistant(
  userId: string,
  assistantId: string,
  fields: UpdateAssistantInput,
): Promise<AssistantRow> {
  const supabase = await createClient();
  const row: Record<string, string | null> = {};

  if (fields.name !== undefined) row.name = fields.name;
  if (fields.systemPrompt !== undefined) row.system_prompt = fields.systemPrompt;
  if (fields.icon !== undefined) row.icon = fields.icon;
  if (fields.openingMessage !== undefined) row.opening_message = fields.openingMessage;

  const { data, error } = await supabase
    .from("assistants")
    .update(row)
    .eq("id", assistantId)
    .eq("user_id", userId)
    .select(ASSISTANT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Assistant not found");
  }

  return data as AssistantRow;
}

export async function deleteUserAssistant(
  userId: string,
  assistantId: string,
): Promise<{ deleted: boolean; chatCount: number }> {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("assistant_id", assistantId)
    .eq("user_id", userId);

  if (countError) {
    throw new Error(countError.message);
  }

  const chatCount = count ?? 0;
  if (chatCount > 0) {
    return { deleted: false, chatCount };
  }

  const { data, error } = await supabase
    .from("assistants")
    .delete()
    .eq("id", assistantId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return { deleted: data != null, chatCount: 0 };
}

export async function getUserAssistant(
  userId: string,
  assistantId: string,
): Promise<AssistantRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assistants")
    .select(ASSISTANT_COLUMNS)
    .eq("id", assistantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as AssistantRow | null;
}
