import {
  buildAllowedEmbeddingKeys,
  buildEmbeddingModelOptionsFromDtos,
  rowToModelConfigDto,
} from "@/lib/console/model-configs";
import type { EmbeddingModelOption } from "@/lib/data/types";
import { listUserModelConfigRows } from "@/lib/data/browser/model-configs";
import { listPlatformModelConfigsForUser } from "@/lib/platform/model-configs";

export async function listEmbeddingModelOptions(): Promise<EmbeddingModelOption[]> {
  const [rows, platformRows] = await Promise.all([
    listUserModelConfigRows(),
    listPlatformModelConfigsForUser(),
  ]);
  return buildEmbeddingModelOptionsFromDtos(
    platformRows,
    rows.map(rowToModelConfigDto),
  );
}

export { buildAllowedEmbeddingKeys };
