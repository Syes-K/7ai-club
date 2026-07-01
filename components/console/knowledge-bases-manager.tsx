"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ConsolePage,
  ConsoleTable,
  ConsoleTableBody,
  ConsoleTableHead,
  ConsoleTh,
} from "@/components/console/console-page";
import { usePageBusy } from "@/components/console/use-page-busy";
import type { KnowledgeBaseListItem } from "@/lib/data/types";
import {
  createFileKnowledgeBase,
  createTextKnowledgeBase,
  deleteKnowledgeBase,
  listKnowledgeBases,
} from "@/lib/data/browser/knowledge-bases";
import { formatConversationTimestamp } from "@/lib/chat/format";
import {
  KB_DESCRIPTION_MAX,
  KB_NAME_MAX,
} from "@/lib/validation/knowledge-base";
import { cn } from "@/lib/utils";

type SourceMode = "text" | "file";

type CreateFormValues = {
  name: string;
  description: string;
  sourceMode: SourceMode;
  text: string;
  file: File | null;
};

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

function sourceTypeLabel(row: KnowledgeBaseListItem): string {
  if (row.source_type === "file") {
    return row.source_filename ?? "File";
  }
  return "Text";
}

const KB_TABLE_ACTIONS_CLASS =
  "sticky right-0 z-10 w-[11rem] min-w-[11rem] max-w-[11rem] bg-[var(--bg-base)] px-3 py-3 shadow-[-10px_0_16px_-12px_rgba(0,0,0,0.45)] group-hover:bg-white/[0.02]";

const KB_TABLE_ACTIONS_HEAD_CLASS =
  "sticky right-0 z-10 w-[11rem] min-w-[11rem] max-w-[11rem] bg-[var(--bg-elevated)] px-3 py-3 shadow-[-10px_0_16px_-12px_rgba(0,0,0,0.35)]";

interface CreateKnowledgeBaseDialogProps {
  open: boolean;
  saving: boolean;
  error: string | null;
  onSave: (values: CreateFormValues) => void;
  onCancel: () => void;
}

function CreateKnowledgeBaseDialog({
  open,
  saving,
  error,
  onSave,
  onCancel,
}: CreateKnowledgeBaseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setName("");
      setDescription("");
      setSourceMode("text");
      setText("");
      setFile(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name: name.trim(),
      description: description.trim(),
      sourceMode,
      text: text.trim(),
      file,
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--neon-primary)]/30 bg-[var(--bg-elevated)] p-6 text-[var(--text-primary)] shadow-[0_0_40px_rgba(0,128,255,0.2)] backdrop:bg-black/60"
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onCancel();
      }}
      onClose={() => !saving && onCancel()}
    >
      <h2 className="font-mono text-lg font-semibold">Create knowledge base</h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="kb-name">Name</Label>
          <Input
            id="kb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={KB_NAME_MAX}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kb-description">Description</Label>
          <Input
            id="kb-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={KB_DESCRIPTION_MAX}
            placeholder="Optional"
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-[var(--text-primary)]">
            Source
          </legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="kb-source-mode"
                checked={sourceMode === "text"}
                onChange={() => setSourceMode("text")}
                disabled={saving}
                className="accent-[var(--neon-primary)]"
              />
              Paste text
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="kb-source-mode"
                checked={sourceMode === "file"}
                onChange={() => setSourceMode("file")}
                disabled={saving}
                className="accent-[var(--neon-primary)]"
              />
              Upload file
            </label>
          </div>
        </fieldset>

        {sourceMode === "text" ? (
          <div className="space-y-2">
            <Label htmlFor="kb-text">Content</Label>
            <textarea
              id="kb-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              required
              placeholder="Paste markdown or plain text"
              className="w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="kb-file">File</Label>
            <Input
              id="kb-file"
              type="file"
              accept=".md,.txt,.markdown,.pdf,.docx"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={saving}
            />
            <p className="text-xs text-[var(--text-muted)]">
              Supported: .md, .txt, .pdf, .docx (max 10 MB)
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

export function KnowledgeBasesManager() {
  const { busy, busyLabel, runBusy } = usePageBusy();
  const [rows, setRows] = useState<KnowledgeBaseListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBaseListItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const hasProcessing = rows.some((row) => row.status === "processing");

  async function loadRows() {
    setLoadError(null);
    const next = await listKnowledgeBases();
    setRows(next);
  }

  useEffect(() => {
    let cancelled = false;
    void runBusy("Loading knowledge bases…", async () => {
      const next = await listKnowledgeBases();
      if (!cancelled) setRows(next);
    }).catch((err) => {
      if (!cancelled) {
        setLoadError(err instanceof Error ? err.message : "Failed to load");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [runBusy]);

  useEffect(() => {
    if (!hasProcessing) return;

    const timer = window.setInterval(() => {
      void loadRows().catch(() => {});
    }, 3000);

    return () => window.clearInterval(timer);
  }, [hasProcessing]);

  function openCreate() {
    if (busy) return;
    setCreateError(null);
    setCreateOpen(true);
  }

  async function handleCreate(values: CreateFormValues) {
    setCreating(true);
    setCreateError(null);

    try {
      await runBusy("Creating knowledge base…", async () => {
        if (values.sourceMode === "text") {
          await createTextKnowledgeBase({
            name: values.name,
            description: values.description || null,
            text: values.text,
          });
        } else {
          if (!values.file) {
            throw new Error("File is required");
          }
          const formData = new FormData();
          formData.set("name", values.name);
          formData.set("description", values.description);
          formData.set("sourceType", "file");
          formData.set("file", values.file);
          await createFileKnowledgeBase(formData);
        }
        await loadRows();
        setCreateOpen(false);
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await runBusy("Deleting knowledge base…", async () => {
        await deleteKnowledgeBase(deleteTarget.id);
        await loadRows();
        setDeleteTarget(null);
      });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ConsolePage
      title="Knowledge Base"
      description="Upload documents and bind knowledge to assistants."
      busy={busy}
      busyLabel={busyLabel}
      action={
        <Button onClick={openCreate} disabled={busy} className="whitespace-nowrap">
          <Plus className="h-4 w-4" />
          Create knowledge base
        </Button>
      }
    >
      {loadError && <p className="mt-8 text-sm text-red-400">{loadError}</p>}

      {!busy && !loadError && rows.length === 0 && (
        <p className="mt-8 text-sm text-[var(--text-muted)]">
          No knowledge bases yet. Create your first one above.
        </p>
      )}

      {!busy && rows.length > 0 && (
        <ConsoleTable className="table-fixed">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[26%]" />
            <col className="w-[9%]" />
            <col className="w-[11%]" />
            <col className="w-[11rem]" />
          </colgroup>
          <ConsoleTableHead>
            <tr>
              <ConsoleTh>Name</ConsoleTh>
              <ConsoleTh>Description</ConsoleTh>
              <ConsoleTh>Source</ConsoleTh>
              <ConsoleTh>Status</ConsoleTh>
              <ConsoleTh>Updated</ConsoleTh>
              <ConsoleTh className={KB_TABLE_ACTIONS_HEAD_CLASS}>Actions</ConsoleTh>
            </tr>
          </ConsoleTableHead>
          <ConsoleTableBody>
            {rows.map((row) => (
              <tr key={row.id} className="group hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                  <span className="block line-clamp-2 break-words" title={row.name}>
                    {row.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  <span
                    className="block line-clamp-2 break-words"
                    title={row.description ?? undefined}
                  >
                    {row.description?.trim() || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  <span
                    className="block line-clamp-2 break-words"
                    title={sourceTypeLabel(row)}
                  >
                    {sourceTypeLabel(row)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      statusBadgeClass(row.status),
                    )}
                    title={row.error_message ?? undefined}
                  >
                    {row.status === "processing" && (
                      <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                    )}
                    {statusLabel(row.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">
                  {formatConversationTimestamp(row.updated_at)}
                </td>
                <td className={KB_TABLE_ACTIONS_CLASS}>
                  <div className="flex flex-col items-stretch gap-1">
                    <Link
                      href={`/console/knowledge/${row.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "justify-start px-2",
                        busy && "pointer-events-none opacity-50",
                      )}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        if (busy) return;
                        setDeleteError(null);
                        setDeleteTarget(row);
                      }}
                      className="justify-start px-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </ConsoleTableBody>
        </ConsoleTable>
      )}

      <CreateKnowledgeBaseDialog
        open={createOpen}
        saving={creating}
        error={createError}
        onSave={handleCreate}
        onCancel={() => !creating && setCreateOpen(false)}
      />

      {deleteTarget && (
        <dialog
          open
          className="fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--neon-primary)]/30 bg-[var(--bg-elevated)] p-6 text-[var(--text-primary)] shadow-[0_0_40px_rgba(0,128,255,0.2)] backdrop:bg-black/60"
        >
          <h2 className="font-mono text-lg font-semibold">Delete knowledge base?</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Delete &ldquo;{deleteTarget.name}&rdquo;? This cannot be undone.
          </p>
          {deleteError && (
            <p className="mt-2 text-sm text-red-400">{deleteError}</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => !deleting && setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </dialog>
      )}
    </ConsolePage>
  );
}
