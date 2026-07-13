export const runtime = "nodejs";

import { adminPlatformRowToDto, listAllPlatformModelConfigs } from "@/lib/admin/platform-models";
import { adminErrorResponse } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/auth";
import { upsertPlatformModelSecret } from "@/lib/platform/secrets";
import { isUserLlmProviderId } from "@/lib/llm/provider";
import { createServiceClient, getServiceClientConfigError } from "@/lib/supabase/service";
import { parseCreateModelBody } from "@/lib/validation/model-config";

export async function GET() {
  try {
    await requireAdmin();
    const configs = await listAllPlatformModelConfigs();
    return Response.json({ configs });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 422 });
    }

    const parsed = parseCreateModelBody(body as Record<string, unknown>);
    if (parsed.error || !parsed.fields) {
      return new Response(parsed.error ?? "Invalid request", { status: 422 });
    }

    const { provider, modelName, apiKey, modelType, embeddingDimensions } =
      parsed.fields;
    if (!isUserLlmProviderId(provider)) {
      return new Response("Invalid provider", { status: 422 });
    }

    const serviceConfigError = getServiceClientConfigError();
    if (serviceConfigError) {
      return new Response(serviceConfigError, { status: 503 });
    }

    if (!process.env.LLM_ENCRYPTION_KEY?.trim()) {
      return new Response("LLM_ENCRYPTION_KEY is not set", { status: 503 });
    }

    const service = createServiceClient();
    const { data, error } = await service
      .from("platform_model_configs")
      .insert({
        provider,
        model_name: modelName,
        model_type: modelType,
        embedding_dimensions: embeddingDimensions,
        test_status: "untested",
        api_key_set: true,
        enabled: true,
      })
      .select(
        "id, display_name, provider, model_name, model_type, embedding_dimensions, enabled, sort_order, test_status, tested_at, test_error, api_key_set, created_at, updated_at",
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return new Response("A platform model with this provider and name already exists", {
          status: 422,
        });
      }
      return new Response(error.message, { status: 500 });
    }

    try {
      await upsertPlatformModelSecret(data.id, apiKey);
    } catch (secretError) {
      await service.from("platform_model_configs").delete().eq("id", data.id);
      const message =
        secretError instanceof Error ? secretError.message : "Failed to save API key";
      return new Response(message, { status: 500 });
    }

    return Response.json(adminPlatformRowToDto(data), { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
