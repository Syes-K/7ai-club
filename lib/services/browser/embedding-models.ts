import {
  buildAllowedEmbeddingKeys,
  buildEmbeddingModelOptions,
} from "@/lib/console/model-configs";
import type { EmbeddingModelOption } from "@/lib/data/types";
import { listUserModelConfigRows } from "@/lib/data/browser/model-configs";

export async function listEmbeddingModelOptions(): Promise<EmbeddingModelOption[]> {
  const rows = await listUserModelConfigRows();
  return buildEmbeddingModelOptions(rows);
}

export { buildAllowedEmbeddingKeys };
