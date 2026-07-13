import {
  buildAllowedEmbeddingKeys,
  buildEmbeddingModelOptionsFromDtos,
  mergeUserAndPlatformModels,
  resolveEmbeddingDimensions,
  resolveEmbeddingLabel,
  rowToModelConfigDto,
  toPassedChatModelOptions,
} from "@/lib/console/model-configs";
import {
  listPlatformModelConfigsServer,
} from "@/lib/platform/model-configs-server";
import { platformRowToDto } from "@/lib/platform/model-configs";
import type { EmbeddingModelOption, ModelConfigRow } from "@/lib/data/types";
import { createClient } from "@/lib/supabase/server";

const MODEL_CONFIG_COLUMNS =
  "id, user_id, provider, model_name, model_type, embedding_dimensions, test_status, tested_at, test_error, api_key_set, created_at, updated_at";

export async function listModelConfigsForUser(userId: string) {
  const supabase = await createClient();
  const [userResult, platformRows] = await Promise.all([
    supabase
      .from("user_model_configs")
      .select(MODEL_CONFIG_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    listPlatformModelConfigsServer(),
  ]);

  if (userResult.error) {
    throw new Error(userResult.error.message);
  }

  const userDtos = ((userResult.data ?? []) as ModelConfigRow[]).map(
    rowToModelConfigDto,
  );
  const platformDtos = platformRows.map(platformRowToDto);

  return mergeUserAndPlatformModels(userDtos, platformDtos);
}

export async function listPassedModelOptionsForUser(userId: string) {
  const configs = await listModelConfigsForUser(userId);
  return toPassedChatModelOptions(configs);
}

export async function listEmbeddingModelOptionsForUser(
  userId: string,
): Promise<EmbeddingModelOption[]> {
  const supabase = await createClient();
  const [userResult, platformRows] = await Promise.all([
    supabase
      .from("user_model_configs")
      .select(MODEL_CONFIG_COLUMNS)
      .eq("user_id", userId)
      .eq("model_type", "embedding")
      .order("created_at", { ascending: true }),
    listPlatformModelConfigsServer(),
  ]);

  if (userResult.error) {
    throw new Error(userResult.error.message);
  }

  const userDtos = ((userResult.data ?? []) as ModelConfigRow[]).map(
    rowToModelConfigDto,
  );
  const platformDtos = platformRows.map(platformRowToDto);

  return buildEmbeddingModelOptionsFromDtos(platformDtos, userDtos);
}

export {
  buildAllowedEmbeddingKeys,
  resolveEmbeddingDimensions,
  resolveEmbeddingLabel,
};
