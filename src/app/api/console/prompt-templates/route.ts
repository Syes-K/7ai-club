import {
  BUILTIN_PROMPT_TEMPLATES,
  readPromptTemplatesWithMeta,
  validatePromptTemplatesForSave,
  writePromptTemplatesAtomic,
} from "@/lib/prompt-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { templates, warning } = readPromptTemplatesWithMeta();
  return Response.json({
    templates,
    /** 内置默认，供管理页「恢复默认」回填（勿与 `templates` 混淆） */
    builtin: BUILTIN_PROMPT_TEMPLATES,
    warning,
  });
}

export async function PUT(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }

  const v = validatePromptTemplatesForSave(json);
  if (!v.ok) {
    return Response.json({ error: v.error }, { status: 400 });
  }

  try {
    writePromptTemplatesAtomic(v.templates);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "写入失败";
    return Response.json({ error: msg }, { status: 500 });
  }

  return Response.json({ ok: true });
}
