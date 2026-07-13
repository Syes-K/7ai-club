export const runtime = "nodejs";

import { rowToModelConfigDto } from "@/lib/console/model-configs";
import { upsertModelConfigSecret } from "@/lib/llm/secrets";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, getServiceClientConfigError } from "@/lib/supabase/service";
import { parseUpdateModelKeyBody } from "@/lib/validation/model-config";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

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

  if (!process.env.LLM_ENCRYPTION_KEY?.trim()) {
    return new Response(
      "LLM_ENCRYPTION_KEY is not set. Run: openssl rand -base64 32, add to .env.local, then restart the dev server.",
      { status: 503 },
    );
  }

  const service = createServiceClient();
  const { data: existing, error: loadError } = await service
    .from("user_model_configs")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError) {
    return new Response(loadError.message, { status: 500 });
  }

  if (!existing) {
    return new Response("Model config not found", { status: 404 });
  }

  try {
    await upsertModelConfigSecret(id, parsed.apiKey);
  } catch (secretError) {
    const message =
      secretError instanceof Error ? secretError.message : "Failed to save API key";
    return new Response(message, { status: 500 });
  }

  const { data, error } = await service
    .from("user_model_configs")
    .update({
      test_status: "untested",
      tested_at: null,
      test_error: null,
      api_key_set: true,
    })
    .eq("id", id)
    .select(
      "id, user_id, provider, model_name, model_type, embedding_dimensions, test_status, tested_at, test_error, api_key_set, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    return new Response(error?.message ?? "Failed to update model", { status: 500 });
  }

  return Response.json(rowToModelConfigDto(data));
}
