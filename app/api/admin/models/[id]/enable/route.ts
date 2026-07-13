export const runtime = "nodejs";

import { adminPlatformRowToDto } from "@/lib/admin/platform-models";
import { adminErrorResponse } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const service = createServiceClient();

    const { data, error } = await service
      .from("platform_model_configs")
      .update({
        enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id, display_name, provider, model_name, model_type, embedding_dimensions, enabled, sort_order, test_status, tested_at, test_error, api_key_set, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      return new Response(error?.message ?? "Not found", { status: 404 });
    }

    return Response.json(adminPlatformRowToDto(data));
  } catch (error) {
    return adminErrorResponse(error);
  }
}
