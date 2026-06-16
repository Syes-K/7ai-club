"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface DeleteConversationDialogProps {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

export function DeleteConversationDialog({
  open,
  title,
  onConfirm,
  onCancel,
  deleting,
}: DeleteConversationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--neon-primary)]/30 bg-[var(--bg-elevated)] p-6 text-[var(--text-primary)] shadow-[0_0_40px_rgba(0,128,255,0.2)] backdrop:bg-black/60 open:animate-in"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
    >
      <h2 className="font-mono text-lg font-semibold">Delete conversation?</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Delete &ldquo;{title}&rdquo;? This cannot be undone.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </dialog>
  );
}
