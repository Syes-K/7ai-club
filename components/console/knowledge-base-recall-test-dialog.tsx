"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldHint } from "@/components/ui/field-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ConsoleTable,
  ConsoleTableBody,
  ConsoleTableHead,
  ConsoleTh,
} from "@/components/console/console-page";
import {
  getKnowledgeBaseById,
  runKnowledgeBaseRecallTest,
  type RecallTestResult,
} from "@/lib/data/browser/knowledge-bases";
import { getUserProfile } from "@/lib/data/browser/profile";
import type { KnowledgeBaseListItem } from "@/lib/data/types";
import {
  DEFAULT_RAG_CONFIDENCE,
  DEFAULT_RAG_QUERY_OPTIMIZE_ENABLED,
  DEFAULT_RAG_TOP_K,
} from "@/lib/rag/defaults";
import { formatRecallThresholdHint } from "@/lib/rag/recall-hints";
import type { KnowledgeBaseRow } from "@/lib/rag/types";

export type KnowledgeBaseRecallTarget = {
  id: string;
  name: string;
  status: KnowledgeBaseListItem["status"];
};

type RecallHit = RecallTestResult["hits"][number];

interface KnowledgeBaseRecallTestDialogProps {
  target: KnowledgeBaseRecallTarget;
  onClose: () => void;
  onBusy?: (busy: boolean, label?: string) => void;
}

export function KnowledgeBaseRecallTestDialog(
  props: KnowledgeBaseRecallTestDialogProps,
) {
  return (
    <KnowledgeBaseRecallTestDialogContent key={props.target.id} {...props} />
  );
}

function KnowledgeBaseRecallTestDialogContent({
  target,
  onClose,
  onBusy,
}: KnowledgeBaseRecallTestDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isReady = target.status === "ready";
  const fieldSuffix = target.id.slice(0, 8);

  const [kb, setKb] = useState<KnowledgeBaseRow | null>(null);
  const [query, setQuery] = useState("");
  const [threshold, setThreshold] = useState(String(DEFAULT_RAG_CONFIDENCE));
  const [topK, setTopK] = useState(String(DEFAULT_RAG_TOP_K));
  const [queryOptimize, setQueryOptimize] = useState(
    DEFAULT_RAG_QUERY_OPTIMIZE_ENABLED,
  );
  const [hits, setHits] = useState<RecallHit[]>([]);
  const [meta, setMeta] = useState<RecallTestResult["meta"] | null>(null);
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void getUserProfile()
      .then((profile) => {
        if (cancelled || !profile) return;
        setThreshold(String(profile.rag_confidence_threshold));
        setTopK(String(profile.rag_top_k));
        setQueryOptimize(profile.rag_query_optimize_enabled);
      })
      .catch(() => {});

    void getKnowledgeBaseById(target.id)
      .then((row) => {
        if (cancelled || !row) return;
        setKb(row as KnowledgeBaseRow);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [target.id]);

  function handleClose() {
    if (running) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (running) return;

    setError(null);
    setRan(false);
    setMeta(null);

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Query is required");
      return;
    }

    const parsedThreshold = Number.parseFloat(threshold);
    if (
      !Number.isFinite(parsedThreshold) ||
      parsedThreshold <= 0 ||
      parsedThreshold > 1
    ) {
      setError("Confidence threshold must be between 0 and 1");
      return;
    }

    const parsedTopK = Number.parseInt(topK, 10);
    if (!Number.isInteger(parsedTopK) || parsedTopK < 1 || parsedTopK > 50) {
      setError("Top K must be between 1 and 50");
      return;
    }

    setRunning(true);
    onBusy?.(true, "Running recall test…");

    try {
      const result = await runKnowledgeBaseRecallTest(target.id, {
        query: trimmedQuery,
        confidenceThreshold: parsedThreshold,
        topK: parsedTopK,
        queryOptimize,
      });
      setHits(result.hits);
      setMeta(result.meta);
      setRan(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recall test failed");
    } finally {
      setRunning(false);
      onBusy?.(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--neon-primary)]/30 bg-[var(--bg-elevated)] p-6 text-[var(--text-primary)] shadow-[0_0_40px_rgba(0,128,255,0.2)] backdrop:bg-black/60"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClose={() => !running && onClose()}
    >
      <h2 className="font-mono text-lg font-semibold">Recall test</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {target.name}
        {kb && (
          <>
            {" "}
            ·{" "}
            <span className="font-mono text-xs">
              {kb.embedding_provider} · {kb.embedding_model}
            </span>
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Vector retrieval with optional query optimization. Override confidence, Top
        K, and optimization below for testing.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`recall-query-${fieldSuffix}`}>Query</Label>
          <textarea
            id={`recall-query-${fieldSuffix}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            disabled={!isReady || running}
            placeholder="Ask a question to test retrieval"
            className="w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)] disabled:opacity-60"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`recall-threshold-${fieldSuffix}`}>
              Confidence threshold
            </Label>
            <Input
              id={`recall-threshold-${fieldSuffix}`}
              type="number"
              min={0.05}
              max={1}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              disabled={!isReady || running}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`recall-top-k-${fieldSuffix}`}>Top K</Label>
            <Input
              id={`recall-top-k-${fieldSuffix}`}
              type="number"
              min={1}
              max={50}
              step={1}
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              disabled={!isReady || running}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id={`recall-query-optimize-${fieldSuffix}`}
            type="checkbox"
            checked={queryOptimize}
            onChange={(e) => setQueryOptimize(e.target.checked)}
            disabled={!isReady || running}
            className="h-4 w-4 rounded border-[var(--neon-primary)]/40 accent-[var(--neon-primary)]"
          />
          <Label
            htmlFor={`recall-query-optimize-${fieldSuffix}`}
            className="inline-flex items-center gap-1.5"
          >
            Query optimization
            <FieldHint text="When enabled, rewrites your query using your chat model before vector retrieval. Defaults to your Profile preference." />
          </Label>
        </div>

        {!isReady && (
          <p className="text-sm text-[var(--text-muted)]">
            Recall test is available when status is Ready.
          </p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={running}
          >
            Close
          </Button>
          <Button type="submit" disabled={!isReady || running}>
            {running ? "Running…" : "Run recall test"}
          </Button>
        </div>
      </form>

      {ran && meta && (
        <div className="mt-4 rounded-lg border border-[var(--neon-primary)]/15 p-3 text-sm">
          {meta.queryOptimized && (
            <p className="text-[var(--text-muted)]">
              Original:{" "}
              <span className="text-[var(--text-primary)]">
                {meta.originalQuery}
              </span>
            </p>
          )}
          <p
            className={
              meta.queryOptimized
                ? "mt-2 text-[var(--text-muted)]"
                : "text-[var(--text-muted)]"
            }
          >
            {meta.queryOptimized
              ? "Optimized query"
              : "Query used for retrieval"}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[var(--text-primary)]">
            {meta.optimizedQuery}
          </p>
          <p className="mt-2 text-[var(--text-muted)]">
            Threshold{" "}
            <span className="font-mono text-[var(--text-primary)]">
              {meta.threshold.toFixed(2)}
            </span>
            {" · "}
            Top K{" "}
            <span className="font-mono text-[var(--text-primary)]">
              {meta.topK}
            </span>
          </p>
        </div>
      )}

      {ran && hits.length === 0 && (
        <div className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
          <p>No results above the confidence threshold.</p>
          {meta && (
            <p>
              Current threshold:{" "}
              <span className="font-mono text-[var(--text-primary)]">
                {meta.threshold.toFixed(2)}
              </span>
              {meta.bestBelowThreshold && (
                <>
                  {" "}
                  · Best match scored{" "}
                  <span className="font-mono text-[var(--text-primary)]">
                    {meta.bestBelowThreshold.score.toFixed(3)}
                  </span>
                </>
              )}
            </p>
          )}
          {meta?.bestBelowThreshold && kb && (
            <p>
              {formatRecallThresholdHint({
                embeddingProvider: kb.embedding_provider,
                embeddingModel: kb.embedding_model,
                profileThreshold: meta.profileThreshold,
                bestScore: meta.bestBelowThreshold.score,
              })}
            </p>
          )}
        </div>
      )}

      {hits.length > 0 && (
        <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-[var(--neon-primary)]/15">
          <ConsoleTable>
            <ConsoleTableHead>
              <tr>
                <ConsoleTh>Score</ConsoleTh>
                <ConsoleTh>Location</ConsoleTh>
                <ConsoleTh>Content</ConsoleTh>
              </tr>
            </ConsoleTableHead>
            <ConsoleTableBody>
              {hits.map((hit, index) => (
                <tr key={`${hit.charStart}-${index}`} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--text-primary)]">
                    {hit.score.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {hit.headingPath ?? "—"}
                  </td>
                  <td className="max-w-md px-4 py-3 text-[var(--text-primary)]">
                    {hit.content}
                  </td>
                </tr>
              ))}
            </ConsoleTableBody>
          </ConsoleTable>
        </div>
      )}
    </dialog>
  );
}
