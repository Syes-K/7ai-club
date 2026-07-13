export const runtime = "nodejs";

import {
  deletePlatformAssistantAdmin,
  updatePlatformAssistantAdmin,
} from "@/lib/admin/platform-assistants";
import { adminErrorResponse } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/auth";
import { parseAssistantFormBody } from "@/lib/validation/assistant";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 422 });
    }

    const parsed = parseAssistantFormBody(body as Record<string, unknown>);
    if (parsed.error || !parsed.values) {
      return new Response(parsed.error ?? "Invalid request", { status: 422 });
    }

    const assistant = await updatePlatformAssistantAdmin(id, {
      name: parsed.values.name,
      systemPrompt: parsed.values.systemPrompt,
      icon: parsed.values.icon,
      openingMessage: parsed.values.openingMessage,
      enabled:
        typeof (body as Record<string, unknown>).enabled === "boolean"
          ? ((body as Record<string, unknown>).enabled as boolean)
          : undefined,
    });

    return Response.json(assistant);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await deletePlatformAssistantAdmin(id);
    return Response.json({ ok: true });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error
        ? (error as Error & { status: number }).status
        : 500;
    if (status === 409) {
      return new Response(error instanceof Error ? error.message : "Conflict", {
        status: 409,
      });
    }
    return adminErrorResponse(error);
  }
}
