export const runtime = "nodejs";

import { rowToModelConfigDto } from "@/lib/console/model-configs";
import { upsertModelConfigSecret } from "@/lib/llm/secrets";
import { isUserLlmProviderId } from "@/lib/llm/provider";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, getServiceClientConfigError } from "@/lib/supabase/service";
import { parseCreateModelBody } from "@/lib/validation/model-config";

export async function POST(req: Request) {
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
    return new Response(
      "LLM_ENCRYPTION_KEY is not set. Run: openssl rand -base64 32, add to .env.local, then restart the dev server.",
      { status: 503 },
    );
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("user_model_configs")
    .insert({
      user_id: user.id,
      provider,
      model_name: modelName,
      model_type: modelType,
      embedding_dimensions: embeddingDimensions,
      test_status: "untested",
      api_key_set: true,
    })
    .select(
      "id, user_id, provider, model_name, model_type, embedding_dimensions, test_status, tested_at, test_error, api_key_set, created_at, updated_at",
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      return new Response(
        "A model with this provider and name already exists",
        { status: 422 },
      );
    }
    return new Response(error.message, { status: 500 });
  }

  try {
    await upsertModelConfigSecret(data.id, apiKey);
  } catch (secretError) {
    await service.from("user_model_configs").delete().eq("id", data.id);
    const message =
      secretError instanceof Error ? secretError.message : "Failed to save API key";
    return new Response(message, { status: 500 });
  }

  return Response.json(rowToModelConfigDto(data), { status: 201 });
}
