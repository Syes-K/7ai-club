"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ConsolePage } from "@/components/console/console-page";
import { usePageBusy } from "@/components/console/use-page-busy";
import {
  getKnowledgeBaseById,
  listKnowledgeBaseChunks,
  type KnowledgeBaseChunkItem,
} from "@/lib/data/browser/knowledge-bases";
import type { KnowledgeBaseRow } from "@/lib/rag/types";
import { cn } from "@/lib/utils";

interface KnowledgeBaseChunksPageProps {
  id: string;
}

export function KnowledgeBaseChunksPage({ id }: KnowledgeBaseChunksPageProps) {
  const { busy, busyLabel, runBusy } = usePageBusy();
  const [kb, setKb] = useState<KnowledgeBaseRow | null>(null);
  const [chunks, setChunks] = useState<KnowledgeBaseChunkItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void runBusy("Loading chunks…", async () => {
      const row = await getKnowledgeBaseById(id);
      if (cancelled) return;
      if (!row) {
        setLoadError("Knowledge base not found");
        return;
      }
      const typed = row as KnowledgeBaseRow;
      setKb(typed);

      if (typed.status === "ready") {
        const rows = await listKnowledgeBaseChunks(id);
        if (!cancelled) setChunks(rows);
      }
    }).catch((err) => {
      if (!cancelled) {
        setLoadError(err instanceof Error ? err.message : "Failed to load");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, runBusy]);

  return (
    <ConsolePage
      title={kb ? `${kb.name} — Chunks` : "Knowledge base chunks"}
      description="Indexed text segments used for vector retrieval."
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

      {kb && kb.status !== "ready" && (
        <p className="mt-8 text-sm text-[var(--text-muted)]">
          Chunks are available when status is Ready.
        </p>
      )}

      {kb && kb.status === "ready" && chunks.length === 0 && (
        <p className="mt-8 text-sm text-[var(--text-muted)]">No chunks indexed yet.</p>
      )}

      {chunks.length > 0 && (
        <ol className="mt-6 space-y-4">
          {chunks.map((chunk) => (
            <li
              key={chunk.chunk_index}
              className="rounded-lg border border-[var(--neon-primary)]/15 p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[var(--text-muted)]">
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  Chunk #{chunk.chunk_index + 1}
                </span>
                <span>
                  {chunk.heading_path ?? "—"} · chars {chunk.char_start}–{chunk.char_end}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                {chunk.content}
              </p>
            </li>
          ))}
        </ol>
      )}
    </ConsolePage>
  );
}
