"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ConsolePage } from "@/components/console/console-page";
import { usePageBusy } from "@/components/console/use-page-busy";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { getKnowledgeBaseById } from "@/lib/data/browser/knowledge-bases";
import {
  contentEmptyMessage,
  contentStats,
  displayContent,
  sourceSummary,
} from "@/lib/console/knowledge-base-display";
import type { KnowledgeBaseRow } from "@/lib/rag/types";
import { cn } from "@/lib/utils";

interface KnowledgeBaseContentPageProps {
  id: string;
}

export function KnowledgeBaseContentPage({ id }: KnowledgeBaseContentPageProps) {
  const { busy, busyLabel, runBusy } = usePageBusy();
  const [kb, setKb] = useState<KnowledgeBaseRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void runBusy("Loading content…", async () => {
      const row = await getKnowledgeBaseById(id);
      if (cancelled) return;
      if (!row) {
        setLoadError("Knowledge base not found");
        return;
      }
      setKb(row as KnowledgeBaseRow);
    }).catch((err) => {
      if (!cancelled) {
        setLoadError(err instanceof Error ? err.message : "Failed to load");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, runBusy]);

  useEffect(() => {
    if (kb?.status !== "processing") return;

    const timer = window.setInterval(() => {
      void getKnowledgeBaseById(id)
        .then((row) => {
          if (!row) return;
          setKb(row as KnowledgeBaseRow);
        })
        .catch(() => {});
    }, 3000);

    return () => window.clearInterval(timer);
  }, [id, kb?.status]);

  const content = kb ? displayContent(kb) : null;
  const stats = content ? contentStats(content) : null;

  return (
    <ConsolePage
      title={kb ? `${kb.name} — Content` : "Knowledge base content"}
      description="Parsed document text used for chunking and retrieval."
      busy={busy}
      busyLabel={busyLabel}
      action={
        <Link
          href={`/console/knowledge/${id}`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            busy && "pointer-events-none opacity-50",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to details
        </Link>
      }
    >
      {loadError && !kb && (
        <p className="mt-8 text-sm text-red-400">{loadError}</p>
      )}

      {kb && (
        <div className="mt-6 space-y-6">
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Source</dt>
              <dd className="mt-0.5">{sourceSummary(kb)}</dd>
            </div>
            {stats && (
              <>
                <div>
                  <dt className="text-[var(--text-muted)]">Characters</dt>
                  <dd className="mt-0.5 font-mono text-xs">{stats.characters.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Lines</dt>
                  <dd className="mt-0.5 font-mono text-xs">{stats.lines.toLocaleString()}</dd>
                </div>
              </>
            )}
          </dl>

          {content ? (
            <article className="rounded-lg border border-[var(--neon-primary)]/20 bg-[var(--bg-base)] p-6">
              <MarkdownContent content={content} />
            </article>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">{contentEmptyMessage(kb)}</p>
          )}
        </div>
      )}
    </ConsolePage>
  );
}
