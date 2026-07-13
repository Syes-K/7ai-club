export const runtime = "nodejs";

import { adminErrorResponse } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminUsers } from "@/lib/admin/users";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
    const perPage = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("perPage") ?? "20") || 20),
    );
    const q = url.searchParams.get("q") ?? undefined;

    const result = await listAdminUsers({ page, perPage, q });
    return Response.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
