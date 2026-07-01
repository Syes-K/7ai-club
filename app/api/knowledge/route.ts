export const runtime = "nodejs";
export const maxDuration = 300;

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { KB_STORAGE_BUCKET } from "@/lib/rag/defaults";
import { scheduleKnowledgeBaseIngest } from "@/lib/rag/schedule-ingest";
import {
  buildKnowledgeBaseInsertRow,
  getUserProfileForRag,
} from "@/lib/rag/profile";
import {
  createKnowledgeBaseJsonSchema,
  parseCreateKnowledgeBaseForm,
} from "@/lib/validation/knowledge-base";

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").slice(0, 180);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const profile = await getUserProfileForRag(supabase, user.id);
  const baseRow = await buildKnowledgeBaseInsertRow(user.id, profile, supabase);
  const kbId = randomUUID();

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const parsed = parseCreateKnowledgeBaseForm(formData);
    if ("error" in parsed) {
      return new Response(parsed.error, { status: 422 });
    }

    if (parsed.data.sourceType === "file") {
      const file = parsed.data.file;
      const storagePath = `${user.id}/${kbId}/${sanitizeFilename(file.name)}`;
      const service = createServiceClient();
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await service.storage
        .from(KB_STORAGE_BUCKET)
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        return new Response(uploadError.message, { status: 500 });
      }

      const { error } = await supabase.from("knowledge_bases").insert({
        id: kbId,
        ...baseRow,
        name: parsed.data.name,
        description: parsed.data.description,
        source_type: "file",
        source_filename: file.name,
        source_mime: file.type || null,
        storage_path: storagePath,
      });

      if (error) {
        await service.storage.from(KB_STORAGE_BUCKET).remove([storagePath]);
        return new Response(error.message, { status: 500 });
      }
    } else {
      return new Response("Use application/json for text sources", {
        status: 422,
      });
    }
  } else {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 422 });
    }

    const parsed = createKnowledgeBaseJsonSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(parsed.error.issues[0]?.message ?? "Invalid request", {
        status: 422,
      });
    }

    const { error } = await supabase.from("knowledge_bases").insert({
      id: kbId,
      ...baseRow,
      name: parsed.data.name,
      description: parsed.data.description,
      source_type: "text",
      source_text: parsed.data.text,
    });

    if (error) {
      return new Response(error.message, { status: 500 });
    }
  }

  await scheduleKnowledgeBaseIngest(kbId);

  return Response.json({ id: kbId, status: "processing" }, { status: 201 });
}
