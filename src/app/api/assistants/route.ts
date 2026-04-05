import { getChatStore } from "@/lib/chat/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = getChatStore();
  const assistants = store.listAssistantsPublic();
  return Response.json(
    { assistants },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
