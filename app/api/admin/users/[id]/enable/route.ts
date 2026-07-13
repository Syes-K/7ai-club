export const runtime = "nodejs";

import { adminErrorResponse } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/auth";
import { enableAdminUser } from "@/lib/admin/users";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await enableAdminUser(id);
    return Response.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
