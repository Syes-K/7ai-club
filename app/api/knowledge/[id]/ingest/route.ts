export const runtime = "nodejs";
export const maxDuration = 300;

import { createClient } from "@/lib/supabase/server";
import { getRagChunkOverlapTokens, getRagChunkSizeTokens } from "@/lib/rag/config";
import { runKnowledgeBaseIngest } from "@/lib/rag/ingest";

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

  const { data: kb, error: loadError } = await supabase
    .from("knowledge_bases")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return new Response(loadError.message, { status: 500 });
  }

  if (!kb) {
    return new Response("Not found", { status: 404 });
  }

  if (kb.status === "processing") {
    return new Response("Ingest already in progress", { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("knowledge_bases")
    .update({
      status: "processing",
      error_message: null,
      chunk_size_tokens: getRagChunkSizeTokens(),
      chunk_overlap_tokens: getRagChunkOverlapTokens(),
    })
    .eq("id", id)
    .in("status", ["error", "ready"]);

  if (updateError) {
    return new Response(updateError.message, { status: 500 });
  }

  await runKnowledgeBaseIngest(id);

  const { data: refreshed, error: refreshError } = await supabase
    .from("knowledge_bases")
    .select("id, status, error_message")
    .eq("id", id)
    .single();

  if (refreshError || !refreshed) {
    return new Response(refreshError?.message ?? "Failed to load status", {
      status: 500,
    });
  }

  return Response.json(refreshed);
}
