export const runtime = "nodejs";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { KB_STORAGE_BUCKET } from "@/lib/rag/defaults";
import { updateKnowledgeBaseSchema } from "@/lib/validation/knowledge-base";
import { DataError } from "@/lib/data/errors";

const KB_LIST_COLUMNS =
  "id, name, description, source_type, source_filename, status, error_message, updated_at";

const KB_DETAIL_COLUMNS =
  "id, name, description, source_type, source_text, source_filename, source_mime, storage_path, parsed_markdown, status, error_message, embedding_provider, embedding_model, embedding_dimensions, chunk_size_tokens, chunk_overlap_tokens, created_at, updated_at";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("knowledge_bases")
    .select(KB_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(data);
}

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

  const parsed = updateKnowledgeBaseSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(parsed.error.issues[0]?.message ?? "Invalid request", {
      status: 422,
    });
  }

  const row: Record<string, string | null> = {};
  if (parsed.data.name !== undefined) row.name = parsed.data.name;
  if (parsed.data.description !== undefined) {
    row.description = parsed.data.description;
  }

  const { data, error } = await supabase
    .from("knowledge_bases")
    .update(row)
    .eq("id", id)
    .select(KB_LIST_COLUMNS)
    .maybeSingle();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(data);
}

export async function DELETE(_req: Request, context: RouteContext) {
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
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return new Response(loadError.message, { status: 500 });
  }

  if (!kb) {
    return new Response("Not found", { status: 404 });
  }

  const { error } = await supabase.rpc("delete_knowledge_base", {
    p_kb_id: id,
  });

  if (error) {
    if (error.message.startsWith("kb_in_use:")) {
      const count = error.message.split(":")[1] ?? "0";
      return new Response(
        `This knowledge base is bound to ${count} assistant(s). Unbind it first.`,
        { status: 409 },
      );
    }
    throw new DataError(error.message, error.code);
  }

  if (kb.storage_path) {
    try {
      const service = createServiceClient();
      await service.storage.from(KB_STORAGE_BUCKET).remove([kb.storage_path]);
    } catch (storageError) {
      console.error("Failed to delete knowledge base file:", storageError);
    }
  }

  return new Response(null, { status: 204 });
}
