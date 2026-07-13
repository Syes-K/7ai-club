export const runtime = "nodejs";

import { adminErrorResponse } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/auth";
import { disableAdminUser } from "@/lib/admin/users";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;

    if (id === admin.id) {
      return new Response("Cannot disable your own account", { status: 400 });
    }

    await disableAdminUser(id);
    return Response.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
