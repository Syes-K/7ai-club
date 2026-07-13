export const runtime = "nodejs";

import {
  createPlatformAssistantAdmin,
  listPlatformAssistantsAdmin,
} from "@/lib/admin/platform-assistants";
import { adminErrorResponse } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/auth";
import {
  parseAssistantFormBody,
  validateAssistantCreate,
} from "@/lib/validation/assistant";

export async function GET() {
  try {
    await requireAdmin();
    const assistants = await listPlatformAssistantsAdmin();
    return Response.json({ assistants });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

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

    const validationError = validateAssistantCreate(parsed.values);
    if (validationError) {
      return new Response(validationError, { status: 422 });
    }

    const enabled =
      typeof (body as Record<string, unknown>).enabled === "boolean"
        ? (body as Record<string, unknown>).enabled
        : true;

    const assistant = await createPlatformAssistantAdmin({
      name: parsed.values.name,
      systemPrompt: parsed.values.systemPrompt,
      icon: parsed.values.icon,
      openingMessage: parsed.values.openingMessage,
      enabled: enabled as boolean,
    });

    return Response.json(assistant, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
