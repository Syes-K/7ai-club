import { createClient } from "@/lib/supabase/client";
import type { ModelConfigRow } from "@/lib/data/types";
import { throwIfError } from "@/lib/data/errors";
import type { UserLlmProviderId } from "@/lib/llm/provider";

const PUBLIC_COLUMNS =
  "id, user_id, provider, model_name, model_type, embedding_dimensions, test_status, tested_at, test_error, api_key_set, created_at, updated_at";

export async function listUserModelConfigRows(): Promise<ModelConfigRow[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("user_model_configs")
    .select(PUBLIC_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  throwIfError(error);
  return (data ?? []) as ModelConfigRow[];
}

export async function updateUserModelConfig(
  id: string,
  fields: {
    provider?: UserLlmProviderId;
    modelName?: string;
    modelType?: import("@/lib/constants/model-types").ModelTypeId;
    embeddingDimensions?: number | null;
  },
): Promise<ModelConfigRow> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const row: Record<string, unknown> = {
    test_status: "untested",
    tested_at: null,
    test_error: null,
  };

  if (fields.provider) {
    row.provider = fields.provider;
  }
  if (fields.modelName) {
    row.model_name = fields.modelName;
  }
  if (fields.modelType) {
    row.model_type = fields.modelType;
  }
  if ("embeddingDimensions" in fields) {
    row.embedding_dimensions = fields.embeddingDimensions ?? null;
  }

  const { data, error } = await supabase
    .from("user_model_configs")
    .update(row)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(PUBLIC_COLUMNS)
    .single();

  throwIfError(error);
  if (!data) {
    throw new Error("Model config not found");
  }

  return data as ModelConfigRow;
}

export async function deleteUserModelConfig(id: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("user_model_configs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  throwIfError(error);
}

export async function getUserProfilePreferenceConfigId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("preferred_model_config_id")
    .eq("user_id", user.id)
    .maybeSingle();

  throwIfError(error);
  return (data?.preferred_model_config_id as string | null) ?? null;
}
