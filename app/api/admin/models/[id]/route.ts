export const runtime = "nodejs";

import { adminPlatformRowToDto } from "@/lib/admin/platform-models";
import { adminErrorResponse } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { parseUpdateModelMetadataBody } from "@/lib/validation/model-config";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 422 });
    }

    const parsed = parseUpdateModelMetadataBody(body as Record<string, unknown>);
    if (parsed.error) {
      return new Response(parsed.error, { status: 422 });
    }

    const service = createServiceClient();
    const row: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.fields?.provider) row.provider = parsed.fields.provider;
    if (parsed.fields?.modelName) row.model_name = parsed.fields.modelName;
    if (parsed.fields?.embeddingDimensions !== undefined) {
      row.embedding_dimensions = parsed.fields.embeddingDimensions;
    }
    if (typeof (body as Record<string, unknown>).displayName === "string") {
      row.display_name = (body as Record<string, unknown>).displayName;
    }
    if (typeof (body as Record<string, unknown>).enabled === "boolean") {
      row.enabled = (body as Record<string, unknown>).enabled;
    }

    const { data, error } = await service
      .from("platform_model_configs")
      .update(row)
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

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const service = createServiceClient();

    const { count } = await service
      .from("user_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("preferred_model_config_id", id);

    if ((count ?? 0) > 0) {
      return new Response("Model is referenced by user preferences", { status: 409 });
    }

    const { error } = await service
      .from("platform_model_configs")
      .delete()
      .eq("id", id);

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
