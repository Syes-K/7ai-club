import {
  AdminForbiddenError,
  UnauthorizedError,
} from "@/lib/admin/auth";

export function adminErrorResponse(error: unknown): Response {
  if (error instanceof UnauthorizedError) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (error instanceof AdminForbiddenError) {
    return new Response("Forbidden", { status: 403 });
  }

  const message = error instanceof Error ? error.message : "Internal error";
  return new Response(message, { status: 500 });
}
