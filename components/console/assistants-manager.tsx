"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ASSISTANT_ICON_MAX_LENGTH } from "@/lib/console/assistant-fields";
import { formatConversationTimestamp } from "@/lib/chat/format";

type AssistantRow = {
  id: string;
  icon: string | null;
  name: string;
  openingMessage: string | null;
  systemPrompt: string;
  updatedAt: string;
};

type AssistantFormValues = {
  icon: string;
  name: string;
  openingMessage: string;
  systemPrompt: string;
};

interface AssistantFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: AssistantFormValues;
  saving: boolean;
  error: string | null;
  onSave: (values: AssistantFormValues) => void;
  onCancel: () => void;
}

function AssistantFormDialog({
  open,
  mode,
  initial,
  saving,
  error,
  onSave,
  onCancel,
}: AssistantFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [icon, setIcon] = useState("");
  const [name, setName] = useState("");
  const [openingMessage, setOpeningMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) {
      setIcon(initial?.icon ?? "");
      setName(initial?.name ?? "");
      setOpeningMessage(initial?.openingMessage ?? "");
      setSystemPrompt(initial?.systemPrompt ?? "");
    }
  }, [open, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      icon: icon.trim(),
      name: name.trim(),
      openingMessage: openingMessage.trim(),
      systemPrompt: systemPrompt.trim(),
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
      <h2 className="font-mono text-lg font-semibold">
        {mode === "create" ? "Create assistant" : "Edit assistant"}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="assistant-icon">Icon</Label>
          <Input
            id="assistant-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={ASSISTANT_ICON_MAX_LENGTH}
            placeholder="Optional emoji"
            className="max-w-[8rem] text-center text-xl"
          />
          <p className="text-xs text-[var(--text-muted)]">
            Optional emoji shown in lists and chat header.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assistant-name">Name</Label>
          <Input
            id="assistant-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assistant-opening">Opening message</Label>
          <textarea
            id="assistant-opening"
            value={openingMessage}
            onChange={(e) => setOpeningMessage(e.target.value)}
            rows={3}
            placeholder="First message sent when a new chat starts"
            className="w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assistant-prompt">System prompt</Label>
          <textarea
            id="assistant-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            required
            className="w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

function truncate(text: string | null, maxLen: number): string {
  if (!text) return "—";
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

export function AssistantsManager() {
  const [assistants, setAssistants] = useState<AssistantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AssistantRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function loadAssistants() {
    setLoadError(null);
    const res = await fetch("/api/assistants");
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(typeof body.error === "string" ? body.error : "Failed to load");
    }
    const data = await res.json();
    setAssistants(data.assistants ?? []);
  }

  useEffect(() => {
    loadAssistants()
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setFormMode("create");
    setEditingId(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(row: AssistantRow) {
    setFormMode("edit");
    setEditingId(row.id);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave(values: AssistantFormValues) {
    setSaving(true);
    setFormError(null);

    const payload = {
      icon: values.icon || null,
      name: values.name,
      openingMessage: values.openingMessage || null,
      systemPrompt: values.systemPrompt,
    };

    try {
      const res =
        formMode === "create"
          ? await fetch("/api/assistants", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/assistants/${editingId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Failed to save");
      }

      await loadAssistants();
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/assistants/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Failed to delete");
      }

      await loadAssistants();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  const editingAssistant = assistants.find((row) => row.id === editingId);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold">Assistants</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Configure personas with icon, opening message, and system prompt.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          Create assistant
        </Button>
      </div>

      {loading && (
        <p className="mt-8 text-sm text-[var(--text-muted)]">Loading assistants…</p>
      )}
      {loadError && <p className="mt-8 text-sm text-red-400">{loadError}</p>}

      {!loading && !loadError && assistants.length === 0 && (
        <p className="mt-8 text-sm text-[var(--text-muted)]">
          No assistants yet. Create your first one above.
        </p>
      )}

      {!loading && assistants.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--neon-primary)]/15">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--neon-primary)]/15 bg-[var(--bg-elevated)]/80">
              <tr>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Icon
                </th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Name
                </th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Opening message
                </th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Updated
                </th>
                <th className="px-4 py-3 text-right font-mono text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neon-primary)]/10">
              {assistants.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-xl leading-none">
                    {row.icon ?? (
                      <span className="text-sm text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    {row.name}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-[var(--text-muted)]">
                    {truncate(row.openingMessage, 80)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">
                    {formatConversationTimestamp(row.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(row);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AssistantFormDialog
        open={formOpen}
        mode={formMode}
        initial={
          editingAssistant
            ? {
                icon: editingAssistant.icon ?? "",
                name: editingAssistant.name,
                openingMessage: editingAssistant.openingMessage ?? "",
                systemPrompt: editingAssistant.systemPrompt,
              }
            : undefined
        }
        saving={saving}
        error={formError}
        onSave={handleSave}
        onCancel={() => !saving && setFormOpen(false)}
      />

      {deleteTarget && (
        <dialog
          open
          className="fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--neon-primary)]/30 bg-[var(--bg-elevated)] p-6 text-[var(--text-primary)] shadow-[0_0_40px_rgba(0,128,255,0.2)] backdrop:bg-black/60"
        >
          <h2 className="font-mono text-lg font-semibold">Delete assistant?</h2>
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
    </div>
  );
}
