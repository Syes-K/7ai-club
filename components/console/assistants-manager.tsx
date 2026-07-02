"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ASSISTANT_ICON_MAX_LENGTH } from "@/lib/validation/assistant";
import {
  createUserAssistant,
  deleteUserAssistant,
  getAssistantKnowledgeBaseIdsForEdit,
  listAssistants,
  updateUserAssistant,
} from "@/lib/services/browser/assistants";
import { listReadyKnowledgeBaseOptions } from "@/lib/data/browser/knowledge-bases";
import type { AssistantDto } from "@/lib/data/types";
import { formatConversationTimestamp } from "@/lib/chat/format";
import {
  ConsolePage,
  ConsoleTable,
  ConsoleTableBody,
  ConsoleTableHead,
  ConsoleTh,
} from "@/components/console/console-page";
import { ConsoleMultiSelect } from "@/components/console/console-multi-select";
import {
  CONSOLE_TABLE_ACTIONS_CELL_9_5,
  CONSOLE_TABLE_ACTIONS_HEAD_9_5,
  CONSOLE_TABLE_ACTION_BUTTON_CLASS,
  CONSOLE_TABLE_ACTIONS_WRAP_9_5,
  CONSOLE_TABLE_PRE_ACTIONS_CELL,
} from "@/components/console/console-table-actions";
import { usePageBusy } from "@/components/console/use-page-busy";
import { cn } from "@/lib/utils";

type AssistantRow = AssistantDto;

type AssistantFormValues = {
  icon: string;
  name: string;
  openingMessage: string;
  systemPrompt: string;
  knowledgeBaseIds: string[];
};

type KnowledgeBaseOption = { id: string; name: string };

interface AssistantFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: AssistantFormValues;
  readyKnowledgeBases: KnowledgeBaseOption[];
  saving: boolean;
  error: string | null;
  onSave: (values: AssistantFormValues) => void;
  onCancel: () => void;
}

function AssistantFormDialog({
  open,
  mode,
  initial,
  readyKnowledgeBases,
  saving,
  error,
  onSave,
  onCancel,
}: AssistantFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [openingMessage, setOpeningMessage] = useState(initial?.openingMessage ?? "");
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? "");
  const [selectedKbIds, setSelectedKbIds] = useState<string[]>(
    initial?.knowledgeBaseIds ?? [],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      icon: icon.trim(),
      name: name.trim(),
      openingMessage: openingMessage.trim(),
      systemPrompt: systemPrompt.trim(),
      knowledgeBaseIds: selectedKbIds,
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
            className="max-w-[8rem] text-left text-xl"
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

        <div className="space-y-2">
          <Label htmlFor="assistant-knowledge-bases">Knowledge bases</Label>
          {readyKnowledgeBases.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No ready knowledge bases. Create one in{" "}
              <Link href="/console/knowledge" className="text-[var(--neon-primary)] hover:underline">
                Knowledge Base
              </Link>
              .
            </p>
          ) : (
            <ConsoleMultiSelect
              id="assistant-knowledge-bases"
              options={readyKnowledgeBases.map((kb) => ({
                value: kb.id,
                label: kb.name,
              }))}
              value={selectedKbIds}
              onChange={setSelectedKbIds}
              disabled={saving}
              placeholder="Select knowledge bases…"
            />
          )}
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

export function AssistantsManager({
  openCreateOnMount = false,
}: {
  openCreateOnMount?: boolean;
}) {
  const router = useRouter();
  const openedCreateFromMount = useRef(false);
  const { busy, busyLabel, runBusy } = usePageBusy();
  const [assistants, setAssistants] = useState<AssistantRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AssistantRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [readyKnowledgeBases, setReadyKnowledgeBases] = useState<KnowledgeBaseOption[]>(
    [],
  );
  const [formInitial, setFormInitial] = useState<AssistantFormValues | undefined>();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  async function loadAssistants() {
    setLoadError(null);
    const rows = await listAssistants();
    setAssistants(rows);
  }

  useEffect(() => {
    let cancelled = false;
    void runBusy("Loading assistants…", async () => {
      const rows = await listAssistants();
      if (!cancelled) setAssistants(rows);
    })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) setInitialLoadDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [runBusy]);

  async function loadReadyKnowledgeBases() {
    const options = await listReadyKnowledgeBaseOptions();
    setReadyKnowledgeBases(options);
  }

  function openCreate() {
    if (busy) return;
    setFormMode("create");
    setEditingId(null);
    setFormError(null);
    setFormInitial({
      icon: "",
      name: "",
      openingMessage: "",
      systemPrompt: "",
      knowledgeBaseIds: [],
    });
    void loadReadyKnowledgeBases().catch(() => {});
    setFormOpen(true);
  }

  useEffect(() => {
    if (
      !openCreateOnMount ||
      openedCreateFromMount.current ||
      !initialLoadDone ||
      busy
    ) {
      return;
    }
    openedCreateFromMount.current = true;
    setFormMode("create");
    setEditingId(null);
    setFormError(null);
    setFormInitial({
      icon: "",
      name: "",
      openingMessage: "",
      systemPrompt: "",
      knowledgeBaseIds: [],
    });
    void loadReadyKnowledgeBases().catch(() => {});
    setFormOpen(true);
    router.replace("/console/assistants", { scroll: false });
  }, [openCreateOnMount, initialLoadDone, busy, router]);

  function openEdit(row: AssistantRow) {
    if (busy) return;
    setFormMode("edit");
    setEditingId(row.id);
    setFormError(null);
    setFormInitial(undefined);
    void runBusy("Loading assistant…", async () => {
      const [options, kbIds] = await Promise.all([
        listReadyKnowledgeBaseOptions(),
        getAssistantKnowledgeBaseIdsForEdit(row.id),
      ]);
      setReadyKnowledgeBases(options);
      setFormInitial({
        icon: row.icon ?? "",
        name: row.name,
        openingMessage: row.openingMessage ?? "",
        systemPrompt: row.systemPrompt,
        knowledgeBaseIds: kbIds,
      });
      setFormOpen(true);
    }).catch((err) => {
      setLoadError(err instanceof Error ? err.message : "Failed to load assistant");
    });
  }

  async function handleSave(values: AssistantFormValues) {
    setSaving(true);
    setFormError(null);

    const payload = {
      icon: values.icon || null,
      name: values.name,
      openingMessage: values.openingMessage || null,
      systemPrompt: values.systemPrompt,
      knowledgeBaseIds: values.knowledgeBaseIds,
    };

    const label = formMode === "create" ? "Creating assistant…" : "Saving assistant…";

    try {
      await runBusy(label, async () => {
        if (formMode === "create") {
          await createUserAssistant(payload);
        } else if (editingId) {
          await updateUserAssistant(editingId, payload);
        }
        await loadAssistants();
        setFormOpen(false);
      });
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
      await runBusy("Deleting assistant…", async () => {
        await deleteUserAssistant(deleteTarget.id);
        await loadAssistants();
        setDeleteTarget(null);
      });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  const editingAssistant = assistants.find((row) => row.id === editingId);
  const dialogInitial =
    formMode === "create"
      ? formInitial
      : formInitial ??
        (editingAssistant
          ? {
              icon: editingAssistant.icon ?? "",
              name: editingAssistant.name,
              openingMessage: editingAssistant.openingMessage ?? "",
              systemPrompt: editingAssistant.systemPrompt,
              knowledgeBaseIds: editingAssistant.knowledgeBaseIds,
            }
          : undefined);

  return (
    <ConsolePage
      title="Assistants"
      description="Configure personas with icon, opening message, and system prompt."
      busy={busy}
      busyLabel={busyLabel}
      action={
        <Button onClick={openCreate} disabled={busy} className="whitespace-nowrap">
          <Plus className="h-4 w-4" />
          Create assistant
        </Button>
      }
    >
      {loadError && <p className="mt-8 text-sm text-red-400">{loadError}</p>}

      {!busy && !loadError && assistants.length === 0 && (
        <p className="mt-8 text-sm text-[var(--text-muted)]">
          No assistants yet. Create your first one above.
        </p>
      )}

      {!busy && assistants.length > 0 && (
        <ConsoleTable className="table-fixed">
          <colgroup>
            <col className="w-[4rem]" />
            <col className="w-[16%]" />
            <col />
            <col className="w-[18%]" />
            <col className="w-[9.5rem]" />
          </colgroup>
          <ConsoleTableHead>
            <tr>
              <ConsoleTh>Icon</ConsoleTh>
              <ConsoleTh>Name</ConsoleTh>
              <ConsoleTh>Opening message</ConsoleTh>
              <ConsoleTh>Updated</ConsoleTh>
              <ConsoleTh className={CONSOLE_TABLE_ACTIONS_HEAD_9_5}>Actions</ConsoleTh>
            </tr>
          </ConsoleTableHead>
          <ConsoleTableBody>
            {assistants.map((row) => (
              <tr key={row.id} className="group hover:bg-white/[0.02]">
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
                <td className={CONSOLE_TABLE_PRE_ACTIONS_CELL} title={formatConversationTimestamp(row.updatedAt)}>
                  {formatConversationTimestamp(row.updatedAt)}
                </td>
                <td className={CONSOLE_TABLE_ACTIONS_CELL_9_5}>
                  <div className={CONSOLE_TABLE_ACTIONS_WRAP_9_5}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => openEdit(row)}
                      className={CONSOLE_TABLE_ACTION_BUTTON_CLASS}
                    >
                      <Pencil className="h-3.5 w-3.5 shrink-0" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        if (busy) return;
                        setDeleteError(null);
                        setDeleteTarget(row);
                      }}
                      className={cn(
                        CONSOLE_TABLE_ACTION_BUTTON_CLASS,
                        "text-red-400 hover:text-red-300",
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </ConsoleTableBody>
        </ConsoleTable>
      )}

      <AssistantFormDialog
        key={
          formMode === "create"
            ? "create"
            : `${editingId ?? "edit"}-${dialogInitial?.knowledgeBaseIds.join(",") ?? ""}`
        }
        open={formOpen && (formMode === "create" || formInitial != null)}
        mode={formMode}
        readyKnowledgeBases={readyKnowledgeBases}
        initial={dialogInitial}
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
    </ConsolePage>
  );
}
