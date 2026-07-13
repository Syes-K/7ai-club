import Link from "next/link";
import { GridBackground } from "@/components/ui/grid-background";

export default function ForbiddenPage() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[var(--bg-base)] px-4 text-[var(--text-primary)]">
      <GridBackground />
      <div className="relative mx-auto max-w-lg text-center">
        <h1 className="font-mono text-2xl font-semibold">Access denied</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          You do not have permission to access the platform admin area.
        </p>
        <div className="mt-6 flex justify-center gap-4 text-sm">
          <Link href="/chat" className="text-[var(--neon-primary)] hover:underline">
            Back to Chat
          </Link>
          <Link href="/console" className="text-[var(--neon-primary)] hover:underline">
            Console
          </Link>
        </div>
      </div>
    </div>
  );
}
