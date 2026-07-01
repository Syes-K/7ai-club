export const runtime = "nodejs";

import { rowToModelConfigDto } from "@/lib/console/model-configs";
import {
  loadResolvedModelForTest,
  runModelConnectivityTest,
} from "@/lib/llm/resolve-user-model";
import { createServiceClient, getServiceClientConfigError } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
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

  let resolved;
  let modelType = "chat";
  let embeddingDimensions: number | null = null;
  try {
    const supabaseRow = await supabase
      .from("user_model_configs")
      .select("model_type, embedding_dimensions")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (supabaseRow.data) {
      modelType = supabaseRow.data.model_type as string;
      embeddingDimensions = supabaseRow.data.embedding_dimensions as number | null;
    }
    resolved = await loadResolvedModelForTest(user.id, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Model config not found";
    const status = message === "Model config not found" ? 404 : 422;
    return new Response(message, { status });
  }

  const result = await runModelConnectivityTest(resolved, {
    modelType,
    embeddingDimensions,
  });
  const testedAt = new Date().toISOString();
  const service = createServiceClient();

  const { data, error } = await service
    .from("user_model_configs")
    .update({
      test_status: result.ok ? "passed" : "failed",
      tested_at: testedAt,
      test_error: result.ok ? null : result.error,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, user_id, provider, model_name, model_type, embedding_dimensions, test_status, tested_at, test_error, api_key_set, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    return new Response(error?.message ?? "Failed to update test status", {
      status: 500,
    });
  }

  return Response.json(rowToModelConfigDto(data));
}
