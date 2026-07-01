export const runtime = "nodejs";
export const maxDuration = 30;

import { createClient } from "@/lib/supabase/server";
import { resolveUserModelForChat } from "@/lib/llm/resolve-user-model";
import { optimizeRagQuery } from "@/lib/rag/optimize-query";
import { retrieveBestChunk, retrieveChunks } from "@/lib/rag/retrieve";
import { getUserProfileForRag, resolveRagPreferences } from "@/lib/rag/profile";
import { recallTestSchema } from "@/lib/validation/knowledge-base";
import type { UserLlmProviderId } from "@/lib/llm/provider";

type RouteContext = { params: Promise<{ id: string }> };

function kbBinding(kb: {
  id: string;
  name: string;
  embedding_provider: string;
  embedding_model: string;
  embedding_dimensions: number;
}) {
  return {
    id: kb.id,
    name: kb.name,
    embeddingProvider: kb.embedding_provider as UserLlmProviderId,
    embeddingModel: kb.embedding_model,
    embeddingDimensions: kb.embedding_dimensions,
  };
}

export async function POST(req: Request, context: RouteContext) {
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

  const parsed = recallTestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(parsed.error.issues[0]?.message ?? "Invalid request", {
      status: 422,
    });
  }

  const { data: kb, error: kbError } = await supabase
    .from("knowledge_bases")
    .select("id, name, status, embedding_provider, embedding_model, embedding_dimensions")
    .eq("id", id)
    .maybeSingle();

  if (kbError) {
    return new Response(kbError.message, { status: 500 });
  }

  if (!kb) {
    return new Response("Not found", { status: 404 });
  }

  if (kb.status !== "ready") {
    return new Response("Knowledge base is not ready", { status: 409 });
  }

  const profile = await getUserProfileForRag(supabase, user.id);
  const ragPrefs = resolveRagPreferences(profile);
  const originalQuery = parsed.data.query.trim();
  const threshold =
    parsed.data.confidenceThreshold ?? ragPrefs.confidenceThreshold;
  const topK = parsed.data.topK ?? ragPrefs.topK;
  const binding = kbBinding(kb);

  const resolved = await resolveUserModelForChat(
    user.id,
    profile?.preferred_model_config_id ?? null,
    supabase,
  );
  const retrievalQuery = resolved
    ? await optimizeRagQuery(originalQuery, resolved)
    : originalQuery;

  const hits = await retrieveChunks({
    supabase,
    userId: user.id,
    bindings: [binding],
    query: retrievalQuery,
    threshold,
    topK,
  });

  const bestBelowThreshold =
    hits.length === 0
      ? await retrieveBestChunk({
          supabase,
          userId: user.id,
          bindings: [binding],
          query: retrievalQuery,
        })
      : null;

  return Response.json({
    hits: hits.map((hit) => ({
      score: hit.score,
      content: hit.content,
      headingPath: hit.headingPath,
      charStart: hit.charStart,
      charEnd: hit.charEnd,
      kbId: hit.kbId,
      kbName: hit.kbName,
    })),
    meta: {
      originalQuery,
      optimizedQuery: retrievalQuery,
      queryOptimized: retrievalQuery !== originalQuery,
      threshold,
      topK,
      profileThreshold: ragPrefs.confidenceThreshold,
      profileTopK: ragPrefs.topK,
      bestBelowThreshold: bestBelowThreshold
        ? {
            score: bestBelowThreshold.score,
            content: bestBelowThreshold.content,
            headingPath: bestBelowThreshold.headingPath,
          }
        : null,
    },
  });
}
