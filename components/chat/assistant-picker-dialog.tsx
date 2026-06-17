"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AssistantOption = {
  id: string;
  icon: string | null;
  name: string;
};

interface AssistantPickerDialogProps {
  open: boolean;
  creating: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (assistantId: string) => void;
}

export function AssistantPickerDialog({
  open,
  creating,
  onOpenChange,
  onConfirm,
}: AssistantPickerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [assistants, setAssistants] = useState<AssistantOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/assistants")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.error === "string" ? body.error : "Failed to load assistants",
          );
        }
        return res.json();
      })
      .then((data: { assistants: AssistantOption[] }) => {
        if (cancelled) return;
        const list = data.assistants.map((row) => ({
          id: row.id,
          icon: row.icon ?? null,
          name: row.name,
        }));
        setAssistants(list);
        if (list.length === 1) {
          setSelectedId(list[0].id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load assistants");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  function handleCancel() {
    if (creating) return;
    onOpenChange(false);
  }

  function handleConfirm() {
    if (!selectedId || creating) return;
    onConfirm(selectedId);
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--neon-primary)]/30 bg-[var(--bg-elevated)] p-6 text-[var(--text-primary)] shadow-[0_0_40px_rgba(0,128,255,0.2)] backdrop:bg-black/60"
      onCancel={(e) => {
        e.preventDefault();
        handleCancel();
      }}
      onClose={handleCancel}
    >
      <h2 className="font-mono text-lg font-semibold">Choose an assistant</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Select which assistant powers this chat.
      </p>

      <div className="mt-4 min-h-[8rem]">
        {loading && (
          <p className="text-sm text-[var(--text-muted)]">Loading assistants…</p>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {!loading && !error && assistants.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">
            No assistants yet. Create one in{" "}
            <a href="/console/assistants" className="text-[var(--neon-primary)] underline">
              Console
            </a>
            .
          </p>
        )}
        {!loading && !error && assistants.length > 0 && (
          <ul className="space-y-2" role="listbox" aria-label="Assistants">
            {assistants.map((assistant) => (
              <li key={assistant.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedId === assistant.id}
                  onClick={() => setSelectedId(assistant.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                    selectedId === assistant.id
                      ? "border-[var(--neon-primary)]/50 bg-[var(--neon-primary)]/10 text-[var(--text-primary)]"
                      : "border-[var(--neon-primary)]/15 text-[var(--text-muted)] hover:border-[var(--neon-primary)]/30 hover:bg-white/5",
                  )}
                >
                  {assistant.icon ? (
                    <span className="text-lg leading-none" aria-hidden>
                      {assistant.icon}
                    </span>
                  ) : null}
                  <span>{assistant.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={handleCancel} disabled={creating}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedId || creating || loading}
        >
          {creating ? "Creating…" : "Create chat"}
        </Button>
      </div>
    </dialog>
  );
}
