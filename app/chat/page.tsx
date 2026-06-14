import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createConversation,
  getLatestConversationId,
} from "@/lib/chat/conversations";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let conversationId: string;

  try {
    const latestId = await getLatestConversationId(user.id);
    conversationId = latestId ?? (await createConversation(user.id));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to initialize chat";

    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#0F0F23] px-4">
        <div className="max-w-lg space-y-4 rounded-xl border border-white/10 bg-white/5 p-6 text-[#F8FAFC]">
          <h1 className="text-lg font-semibold">Database not initialized</h1>
          <p className="text-sm text-[#F8FAFC]/70">{message}</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[#F8FAFC]/70">
            <li>
              Open{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[#22C55E] hover:underline"
              >
                Supabase Dashboard
              </a>{" "}
              → SQL Editor
            </li>
            <li>
              Run{" "}
              <code className="rounded bg-black/30 px-1">
                supabase/migrations/20260614000000_mvp_chat.sql
              </code>
            </li>
            <li>Refresh this page or visit /chat again</li>
          </ol>
          <Link
            href="/chat"
            className="inline-block text-sm text-[#22C55E] hover:underline"
          >
            Retry
          </Link>
        </div>
      </main>
    );
  }

  redirect(`/chat/${conversationId}`);
}
