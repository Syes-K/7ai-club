import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserLlmProviderId } from "@/lib/llm/provider";

type PlatformModelRef = {
  id: string;
  provider: UserLlmProviderId;
  modelName: string;
};

async function queryFirstPassedPlatformModel(
  supabase: SupabaseClient,
  modelType: "chat" | "embedding",
): Promise<PlatformModelRef | null> {
  const { data, error } = await supabase
    .from("platform_model_configs")
    .select("id, provider, model_name")
    .eq("enabled", true)
    .eq("test_status", "passed")
    .eq("model_type", modelType)
    .eq("api_key_set", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id as string,
    provider: data.provider as UserLlmProviderId,
    modelName: data.model_name as string,
  };
}

export async function fetchDefaultPlatformChatModelId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const row = await queryFirstPassedPlatformModel(supabase, "chat");
  return row?.id ?? null;
}

export async function fetchDefaultPlatformEmbedding(
  supabase: SupabaseClient,
): Promise<{ provider: UserLlmProviderId; model: string } | null> {
  const row = await queryFirstPassedPlatformModel(supabase, "embedding");
  if (!row) {
    return null;
  }
  return { provider: row.provider, model: row.modelName };
}

export async function isPlatformChatModelAvailable(
  configId: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("platform_model_configs")
    .select("id")
    .eq("id", configId)
    .eq("enabled", true)
    .eq("test_status", "passed")
    .eq("model_type", "chat")
    .eq("api_key_set", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data != null;
}
