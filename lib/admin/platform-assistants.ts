import type { AssistantDto } from "@/lib/data/types";
import { createServiceClient } from "@/lib/supabase/service";

const ASSISTANT_COLUMNS =
  "id, name, icon, opening_message, system_prompt, model, user_id, updated_at, is_platform, enabled";

type PlatformAssistantRow = {
  id: string;
  name: string;
  icon: string | null;
  opening_message: string | null;
  system_prompt: string;
  model: string;
  user_id: string | null;
  updated_at: string;
  is_platform: boolean;
  enabled: boolean;
};

function toDto(row: PlatformAssistantRow): AssistantDto & { enabled: boolean } {
  return {
    id: row.id,
    icon: row.icon,
    name: row.name,
    openingMessage: row.opening_message,
    systemPrompt: row.system_prompt,
    updatedAt: row.updated_at,
    knowledgeBaseIds: [],
    enabled: row.enabled,
  };
}

export async function listPlatformAssistantsAdmin(): Promise<
  (AssistantDto & { enabled: boolean })[]
> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("assistants")
    .select(ASSISTANT_COLUMNS)
    .eq("is_platform", true)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PlatformAssistantRow[]).map(toDto);
}

export async function createPlatformAssistantAdmin(values: {
  name: string;
  systemPrompt: string;
  icon: string | null;
  openingMessage: string | null;
  enabled: boolean;
}): Promise<AssistantDto & { enabled: boolean }> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("assistants")
    .insert({
      name: values.name,
      system_prompt: values.systemPrompt,
      icon: values.icon,
      opening_message: values.openingMessage,
      model: "platform",
      is_platform: true,
      enabled: values.enabled,
      user_id: null,
      is_default: false,
    })
    .select(ASSISTANT_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toDto(data as PlatformAssistantRow);
}

export async function updatePlatformAssistantAdmin(
  id: string,
  values: Partial<{
    name: string;
    systemPrompt: string;
    icon: string | null;
    openingMessage: string | null;
    enabled: boolean;
  }>,
): Promise<AssistantDto & { enabled: boolean }> {
  const service = createServiceClient();
  const row: Record<string, unknown> = {};
  if (values.name !== undefined) row.name = values.name;
  if (values.systemPrompt !== undefined) row.system_prompt = values.systemPrompt;
  if (values.icon !== undefined) row.icon = values.icon;
  if (values.openingMessage !== undefined) row.opening_message = values.openingMessage;
  if (values.enabled !== undefined) row.enabled = values.enabled;

  const { data, error } = await service
    .from("assistants")
    .update(row)
    .eq("id", id)
    .eq("is_platform", true)
    .select(ASSISTANT_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toDto(data as PlatformAssistantRow);
}

export async function deletePlatformAssistantAdmin(id: string): Promise<void> {
  const service = createServiceClient();
  const { count, error: countError } = await service
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("assistant_id", id);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) {
    const err = new Error(
      `This assistant is used in ${count} chat(s). Disable it instead.`,
    );
    (err as Error & { status?: number }).status = 409;
    throw err;
  }

  const { error } = await service
    .from("assistants")
    .delete()
    .eq("id", id)
    .eq("is_platform", true);

  if (error) {
    throw new Error(error.message);
  }
}
