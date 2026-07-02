"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, RotateCcw, ScanSearch } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConsoleFileInput } from "@/components/console/console-file-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsolePage } from "@/components/console/console-page";
import {
  KnowledgeBaseRecallTestDialog,
  type KnowledgeBaseRecallTarget,
} from "@/components/console/knowledge-base-recall-test-dialog";
import { usePageBusy } from "@/components/console/use-page-busy";
import {
  contentEmptyMessage,
  contentStats,
  displayContent,
  sourceSummary,
} from "@/lib/console/knowledge-base-display";
import {
  getKnowledgeBaseById,
  getKnowledgeBaseChunkCount,
  replaceKnowledgeBaseFileSource,
  replaceKnowledgeBaseTextSource,
  retryKnowledgeBaseIngest,
  updateKnowledgeBaseMeta,
} from "@/lib/data/browser/knowledge-bases";
import type { KnowledgeBaseListItem } from "@/lib/data/types";
import type { KnowledgeBaseRow } from "@/lib/rag/types";
import {
  KB_DESCRIPTION_MAX,
  KB_NAME_MAX,
} from "@/lib/validation/knowledge-base";
import { formatConversationTimestamp } from "@/lib/chat/format";
import { cn } from "@/lib/utils";

interface KnowledgeBaseDetailProps {
  id: string;
}

function statusBadgeClass(status: KnowledgeBaseListItem["status"]): string {
  switch (status) {
    case "ready":
      return "border-[var(--accent-success)]/40 text-[var(--accent-success)]";
    case "error":
      return "border-red-400/40 text-red-400";
    default:
      return "border-[var(--neon-primary)]/40 text-[var(--neon-primary)]";
  }
}

function statusLabel(status: KnowledgeBaseListItem["status"]): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "error":
      return "Error";
    default:
      return "Processing";
  }
}

export function KnowledgeBaseDetail({ id }: KnowledgeBaseDetailProps) {
  const { busy, busyLabel, runBusy } = usePageBusy();
  const [kb, setKb] = useState<KnowledgeBaseRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metaEditing, setMetaEditing] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaSaved, setMetaSaved] = useState(false);

  const [recallTarget, setRecallTarget] = useState<KnowledgeBaseRecallTarget | null>(
    null,
  );

  const [chunkCount, setChunkCount] = useState<number | null>(null);

  const [sourceEditing, setSourceEditing] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceSaving, setSourceSaving] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);

  async function loadKb(silent = false) {
    if (!silent) setLoadError(null);
    const row = await getKnowledgeBaseById(id);
    if (!row) {
      setLoadError("Knowledge base not found");
      setKb(null);
      return;
    }
    const typed = row as KnowledgeBaseRow;
    setKb(typed);
    setName(typed.name);
    setDescription(typed.description ?? "");
  }

  useEffect(() => {
    let cancelled = false;
    void runBusy("Loading knowledge base…", async () => {
      const row = await getKnowledgeBaseById(id);
      if (cancelled) return;
      if (!row) {
        setLoadError("Knowledge base not found");
        return;
      }
      const typed = row as KnowledgeBaseRow;
      setKb(typed);
      setName(typed.name);
      setDescription(typed.description ?? "");
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
          const typed = row as KnowledgeBaseRow;
          setKb(typed);
          if (!metaEditing) {
            setName(typed.name);
            setDescription(typed.description ?? "");
          }
        })
        .catch(() => {});
    }, 3000);

    return () => window.clearInterval(timer);
  }, [id, kb?.status, metaEditing]);

  useEffect(() => {
    if (kb?.status !== "ready") return;

    let cancelled = false;
    void getKnowledgeBaseChunkCount(id)
      .then((count) => {
        if (!cancelled) setChunkCount(count);
      })
      .catch(() => {
        if (!cancelled) setChunkCount(null);
      });

    return () => {
      cancelled = true;
    };
  }, [id, kb?.status, kb?.updated_at]);

  async function handleSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    setMetaSaving(true);
    setMetaError(null);
    setMetaSaved(false);

    try {
      await runBusy("Saving…", async () => {
        await updateKnowledgeBaseMeta(id, {
          name: name.trim(),
          description: description.trim() || null,
        });
        await loadKb(true);
        setMetaEditing(false);
        setMetaSaved(true);
      });
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setMetaSaving(false);
    }
  }

  function openSourceEditor() {
    if (!kb) return;
    setSourceError(null);
    if (kb.source_type === "text") {
      setSourceText(kb.source_text ?? kb.parsed_markdown ?? "");
    } else {
      setSourceFile(null);
    }
    setSourceEditing(true);
  }

  async function handleReplaceSource(e: React.FormEvent) {
    e.preventDefault();
    if (!kb || kb.status === "processing") return;

    setSourceSaving(true);
    setSourceError(null);

    try {
      await runBusy("Replacing source and re-indexing…", async () => {
        if (kb.source_type === "text") {
          const text = sourceText.trim();
          if (!text) {
            throw new Error("Content is required");
          }
          await replaceKnowledgeBaseTextSource(id, text);
        } else {
          if (!sourceFile) {
            throw new Error("Choose a file to upload");
          }
          await replaceKnowledgeBaseFileSource(id, sourceFile);
        }
        await loadKb(true);
        setSourceEditing(false);
        setChunkCount(null);
      });
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "Failed to replace source");
    } finally {
      setSourceSaving(false);
    }
  }

  async function handleRetryIngest() {
    try {
      await runBusy("Retrying ingestion…", async () => {
        await retryKnowledgeBaseIngest(id);
        await loadKb(true);
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to retry ingestion");
    }
  }

  const isReady = kb?.status === "ready";
  const isError = kb?.status === "error";
  const isProcessing = kb?.status === "processing";
  const content = kb ? displayContent(kb) : null;
  const stats = content ? contentStats(content) : null;

  return (
    <ConsolePage
      title={kb?.name ?? "Knowledge base"}
      description="Edit metadata, retry ingestion, and test retrieval."
      busy={busy}
      busyLabel={busyLabel}
      action={
        <Link
          href="/console/knowledge"
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            busy && "pointer-events-none opacity-50",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Link>
      }
    >
      {loadError && !kb && (
        <p className="mt-8 text-sm text-red-400">{loadError}</p>
      )}

      {kb && (
        <div className="mt-6 space-y-8">
          <section className="rounded-lg border border-[var(--neon-primary)]/15 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-mono text-lg font-semibold">Details</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Updated {formatConversationTimestamp(kb.updated_at)}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  statusBadgeClass(kb.status),
                )}
              >
                {kb.status === "processing" && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {statusLabel(kb.status)}
              </span>
            </div>

            {isError && kb.error_message && (
              <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-300">
                {kb.error_message}
              </div>
            )}

            {isError && (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={handleRetryIngest}
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry ingestion
                </Button>
              </div>
            )}

            {metaEditing ? (
              <form onSubmit={handleSaveMeta} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kb-detail-name">Name</Label>
                  <Input
                    id="kb-detail-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={KB_NAME_MAX}
                    required
                    disabled={metaSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kb-detail-description">Description</Label>
                  <Input
                    id="kb-detail-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={KB_DESCRIPTION_MAX}
                    placeholder="Optional"
                    disabled={metaSaving}
                  />
                </div>
                {metaError && <p className="text-sm text-red-400">{metaError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={metaSaving || busy}>
                    {metaSaving ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={metaSaving || busy}
                    onClick={() => {
                      setName(kb.name);
                      setDescription(kb.description ?? "");
                      setMetaEditing(false);
                      setMetaError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="mt-6 space-y-3 text-sm">
                <div>
                  <dt className="text-[var(--text-muted)]">Name</dt>
                  <dd className="mt-1">{kb.name}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Description</dt>
                  <dd className="mt-1">{kb.description ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Source</dt>
                  <dd className="mt-1">{sourceSummary(kb)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Embedding</dt>
                  <dd className="mt-1 font-mono text-xs">
                    {kb.embedding_provider} · {kb.embedding_model} ({kb.embedding_dimensions}d)
                  </dd>
                </div>
                {metaSaved && (
                  <p className="text-[var(--accent-success)]">Saved.</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      setMetaSaved(false);
                      setMetaEditing(true);
                    }}
                  >
                    Edit name & description
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy || !isReady}
                    onClick={() =>
                      setRecallTarget({
                        id: kb.id,
                        name: kb.name,
                        status: kb.status,
                      })
                    }
                  >
                    <ScanSearch className="h-4 w-4" />
                    Recall test
                  </Button>
                </div>
              </dl>
            )}
          </section>

          <section className="rounded-lg border border-[var(--neon-primary)]/15 p-5">
            <h2 className="font-mono text-lg font-semibold">Content</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Parsed document text used for chunking and retrieval.
            </p>

            {content ? (
              <div className="mt-4 space-y-3">
                {stats && (
                  <p className="text-sm text-[var(--text-muted)]">
                    {stats.characters.toLocaleString()} characters ·{" "}
                    {stats.lines.toLocaleString()} lines
                    {chunkCount != null && chunkCount > 0
                      ? ` · ${chunkCount.toLocaleString()} chunks`
                      : ""}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/console/knowledge/${id}/content`}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      busy && "pointer-events-none opacity-50",
                    )}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View full content
                  </Link>
                  {isReady && chunkCount != null && chunkCount > 0 && (
                    <Link
                      href={`/console/knowledge/${id}/chunks`}
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" }),
                        busy && "pointer-events-none opacity-50",
                      )}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View {chunkCount.toLocaleString()} chunks
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                {contentEmptyMessage(kb)}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-[var(--neon-primary)]/15 p-5">
            <h2 className="font-mono text-lg font-semibold">Replace source</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Update the underlying document and re-chunk / re-embed vectors.
              Source type cannot be changed after creation.
            </p>

            {isProcessing && (
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Wait until processing finishes before replacing source.
              </p>
            )}

            {!isProcessing && !sourceEditing && (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={openSourceEditor}
                >
                  {kb.source_type === "text" ? "Edit text source" : "Upload new file"}
                </Button>
              </div>
            )}

            {!isProcessing && sourceEditing && (
              <form onSubmit={handleReplaceSource} className="mt-4 space-y-4">
                {kb.source_type === "text" ? (
                  <div className="space-y-2">
                    <Label htmlFor="kb-replace-text">Content</Label>
                    <textarea
                      id="kb-replace-text"
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      rows={12}
                      disabled={sourceSaving || busy}
                      placeholder="Paste markdown or plain text"
                      className="w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)] disabled:opacity-60"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="kb-replace-file">File</Label>
                    <ConsoleFileInput
                      id="kb-replace-file"
                      accept=".md,.txt,.markdown,.pdf,.docx"
                      file={sourceFile}
                      onFileChange={setSourceFile}
                      disabled={sourceSaving || busy}
                    />
                    <p className="text-xs text-[var(--text-muted)]">
                      Current file: {kb.source_filename ?? "—"}. Supported: .md,
                      .txt, .pdf, .docx (max 10 MB).
                    </p>
                  </div>
                )}

                {sourceError && <p className="text-sm text-red-400">{sourceError}</p>}

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={sourceSaving || busy}>
                    {sourceSaving ? "Saving…" : "Save & re-index"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={sourceSaving || busy}
                    onClick={() => {
                      setSourceEditing(false);
                      setSourceError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {recallTarget && (
        <KnowledgeBaseRecallTestDialog
          target={recallTarget}
          onClose={() => setRecallTarget(null)}
        />
      )}
    </ConsolePage>
  );
}
