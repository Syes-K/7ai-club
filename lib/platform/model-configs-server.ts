import {
  platformRowToDto,
  PLATFORM_MODEL_COLUMNS,
  type PlatformModelConfigRow,
} from "@/lib/platform/model-configs";
import { createClient } from "@/lib/supabase/server";

export async function listPlatformModelConfigsServer(): Promise<PlatformModelConfigRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_model_configs")
    .select(PLATFORM_MODEL_COLUMNS)
    .eq("enabled", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PlatformModelConfigRow[];
}

export { platformRowToDto };
