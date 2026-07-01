export const runtime = "nodejs";
export const maxDuration = 300;

import { createClient } from "@/lib/supabase/server";
import {
  KnowledgeBaseBusyError,
  KnowledgeBaseSourceTypeError,
  replaceKnowledgeBaseFileSource,
  replaceKnowledgeBaseTextSource,
} from "@/lib/rag/update-source";
import {
  parseReplaceKnowledgeBaseFileForm,
  replaceKnowledgeBaseTextSchema,
} from "@/lib/validation/knowledge-base";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const parsed = parseReplaceKnowledgeBaseFileForm(formData);
      if ("error" in parsed) {
        return new Response(parsed.error, { status: 422 });
      }

      await replaceKnowledgeBaseFileSource(
        supabase,
        user.id,
        id,
        parsed.data.file,
      );
    } else {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return new Response("Invalid JSON", { status: 422 });
      }

      const parsed = replaceKnowledgeBaseTextSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(parsed.error.issues[0]?.message ?? "Invalid request", {
          status: 422,
        });
      }

      await replaceKnowledgeBaseTextSource(
        supabase,
        user.id,
        id,
        parsed.data.text,
      );
    }
  } catch (error) {
    if (error instanceof KnowledgeBaseBusyError) {
      return new Response(error.message, { status: 409 });
    }
    if (error instanceof KnowledgeBaseSourceTypeError) {
      return new Response(error.message, { status: 422 });
    }
    if (error instanceof Error && error.message === "Knowledge base not found") {
      return new Response(error.message, { status: 404 });
    }
    throw error;
  }

  return Response.json({ id, status: "processing" });
}
