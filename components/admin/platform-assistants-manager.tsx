"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ASSISTANT_ICON_MAX_LENGTH } from "@/lib/validation/assistant";
import {
  createAdminPlatformAssistant,
  deleteAdminPlatformAssistant,
  listAdminPlatformAssistants,
  updateAdminPlatformAssistant,
  type PlatformAssistantDto,
} from "@/lib/services/browser/admin-platform-assistants";
import { formatConversationTimestamp } from "@/lib/chat/format";
import {
  ConsolePage,
  ConsoleTable,
  ConsoleTableBody,
  ConsoleTableHead,
  ConsoleTh,
} from "@/components/console/console-page";
import {
  CONSOLE_TABLE_ACTIONS_CELL_9_5,
  CONSOLE_TABLE_ACTIONS_HEAD_9_5,
  CONSOLE_TABLE_ACTION_BUTTON_CLASS,
  CONSOLE_TABLE_ACTIONS_WRAP_9_5,
  CONSOLE_TABLE_PRE_ACTIONS_CELL,
} from "@/components/console/console-table-actions";
import { usePageBusy } from "@/components/console/use-page-busy";
import { cn } from "@/lib/utils";

type AssistantFormValues = {
  icon: string;
  name: string;
  openingMessage: string;
  systemPrompt: string;
  enabled: boolean;
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
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [openingMessage, setOpeningMessage] = useState(initial?.openingMessage ?? "");
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

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
      enabled,
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
        {mode === "create" ? "Create platform assistant" : "Edit platform assistant"}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="platform-assistant-icon">Icon</Label>
          <Input
            id="platform-assistant-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={ASSISTANT_ICON_MAX_LENGTH}
            placeholder="Optional emoji"
            className={cn(
              "max-w-[8rem] text-left placeholder:text-sm",
              icon ? "text-xl" : "text-sm",
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="platform-assistant-name">Name</Label>
          <Input
            id="platform-assistant-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="platform-assistant-opening">Opening message</Label>
          <textarea
            id="platform-assistant-opening"
            value={openingMessage}
            onChange={(e) => setOpeningMessage(e.target.value)}
            rows={3}
            placeholder="First message sent when a new chat starts"
            className="w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="platform-assistant-prompt">System prompt</Label>
          <textarea
            id="platform-assistant-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            required
            className="w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={saving}
          />
          Enabled for all users
        </label>

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

export function PlatformAssistantsManager() {
  const { busy, busyLabel, runBusy } = usePageBusy();
  const [assistants, setAssistants] = useState<PlatformAssistantDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<PlatformAssistantDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PlatformAssistantDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadAssistants = useCallback(async () => {
    const rows = await listAdminPlatformAssistants();
    setAssistants(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void runBusy("Loading assistants…", async () => {
      const rows = await listAdminPlatformAssistants();
      if (!cancelled) setAssistants(rows);
    }).catch((err) => {
      if (!cancelled) {
        setLoadError(err instanceof Error ? err.message : "Failed to load");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [runBusy]);

  function openCreate() {
    if (busy) return;
    setFormMode("create");
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(row: PlatformAssistantDto) {
    if (busy) return;
    setFormMode("edit");
    setEditing(row);
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
      enabled: values.enabled,
    };

    const label =
      formMode === "create" ? "Creating assistant…" : "Saving assistant…";

    try {
      await runBusy(label, async () => {
        if (formMode === "create") {
          await createAdminPlatformAssistant(payload);
        } else if (editing) {
          await updateAdminPlatformAssistant(editing.id, payload);
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
        await deleteAdminPlatformAssistant(deleteTarget.id);
        await loadAssistants();
        setDeleteTarget(null);
      });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  const dialogInitial: AssistantFormValues | undefined =
    formMode === "create"
      ? { icon: "", name: "", openingMessage: "", systemPrompt: "", enabled: true }
      : editing
        ? {
            icon: editing.icon ?? "",
            name: editing.name,
            openingMessage: editing.openingMessage ?? "",
            systemPrompt: editing.systemPrompt,
            enabled: editing.enabled,
          }
        : undefined;

  return (
    <ConsolePage
      title="Platform assistants"
      description="System assistants available to all users in the New Chat picker."
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
          No platform assistants yet. Create one for all users.
        </p>
      )}

      {!busy && assistants.length > 0 && (
        <ConsoleTable className="table-fixed">
          <colgroup>
            <col className="w-[4rem]" />
            <col className="w-[16%]" />
            <col />
            <col className="w-[10%]" />
            <col className="w-[18%]" />
            <col className="w-[9.5rem]" />
          </colgroup>
          <ConsoleTableHead>
            <tr>
              <ConsoleTh>Icon</ConsoleTh>
              <ConsoleTh>Name</ConsoleTh>
              <ConsoleTh>Opening message</ConsoleTh>
              <ConsoleTh>Status</ConsoleTh>
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
                <td className="px-4 py-3 text-sm">
                  {row.enabled ? "Enabled" : "Disabled"}
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
        key={formMode === "create" ? "create" : editing?.id ?? "edit"}
        open={formOpen && dialogInitial != null}
        mode={formMode}
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
          <h2 className="font-mono text-lg font-semibold">Delete platform assistant?</h2>
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
