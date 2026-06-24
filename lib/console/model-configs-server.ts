import {
  mergePlatformDefault,
  toPassedModelOptions,
} from "@/lib/console/model-configs";
import type { ModelConfigRow } from "@/lib/data/types";
import { createClient } from "@/lib/supabase/server";

export async function listModelConfigsForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_model_configs")
    .select(
      "id, user_id, provider, model_name, test_status, tested_at, test_error, api_key_set, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return mergePlatformDefault((data ?? []) as ModelConfigRow[]);
}

export async function listPassedModelOptionsForUser(userId: string) {
  const configs = await listModelConfigsForUser(userId);
  return toPassedModelOptions(configs);
}
