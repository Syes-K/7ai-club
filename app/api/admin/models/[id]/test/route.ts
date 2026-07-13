export const runtime = "nodejs";

import { adminPlatformRowToDto } from "@/lib/admin/platform-models";
import { adminErrorResponse } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/auth";
import {
  loadResolvedPlatformModelForTest,
} from "@/lib/platform/resolve";
import { runModelConnectivityTest } from "@/lib/llm/resolve-user-model";
import { createServiceClient, getServiceClientConfigError } from "@/lib/supabase/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const serviceConfigError = getServiceClientConfigError();
    if (serviceConfigError) {
      return new Response(serviceConfigError, { status: 503 });
    }

    const service = createServiceClient();
    const { data: meta } = await service
      .from("platform_model_configs")
      .select("model_type, embedding_dimensions")
      .eq("id", id)
      .maybeSingle();

    let resolved;
    try {
      resolved = await loadResolvedPlatformModelForTest(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Model config not found";
      return new Response(message, { status: 404 });
    }

    const result = await runModelConnectivityTest(resolved, {
      modelType: meta?.model_type as string | undefined,
      embeddingDimensions: meta?.embedding_dimensions as number | null,
    });

    const testedAt = new Date().toISOString();
    const { data, error } = await service
      .from("platform_model_configs")
      .update({
        test_status: result.ok ? "passed" : "failed",
        tested_at: testedAt,
        test_error: result.ok ? null : result.error,
        updated_at: testedAt,
      })
      .eq("id", id)
      .select(
        "id, display_name, provider, model_name, model_type, embedding_dimensions, enabled, sort_order, test_status, tested_at, test_error, api_key_set, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      return new Response(error?.message ?? "Failed to update", { status: 500 });
    }

    return Response.json(adminPlatformRowToDto(data));
  } catch (error) {
    return adminErrorResponse(error);
  }
}
