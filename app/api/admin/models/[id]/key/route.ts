export const runtime = "nodejs";

import { adminPlatformRowToDto } from "@/lib/admin/platform-models";
import { adminErrorResponse } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/auth";
import { upsertPlatformModelSecret } from "@/lib/platform/secrets";
import { createServiceClient, getServiceClientConfigError } from "@/lib/supabase/service";
import { parseUpdateModelKeyBody } from "@/lib/validation/model-config";

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

    const parsed = parseUpdateModelKeyBody(body as Record<string, unknown>);
    if (parsed.error || !parsed.apiKey) {
      return new Response(parsed.error ?? "Invalid request", { status: 422 });
    }

    const serviceConfigError = getServiceClientConfigError();
    if (serviceConfigError) {
      return new Response(serviceConfigError, { status: 503 });
    }

    await upsertPlatformModelSecret(id, parsed.apiKey);

    const service = createServiceClient();
    const { data, error } = await service
      .from("platform_model_configs")
      .update({
        test_status: "untested",
        tested_at: null,
        test_error: null,
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
