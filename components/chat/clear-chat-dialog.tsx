"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ClearChatDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  clearing: boolean;
}

export function ClearChatDialog({
  open,
  onConfirm,
  onCancel,
  clearing,
}: ClearChatDialogProps) {
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
      <h2 className="font-mono text-lg font-semibold">Clear chat history?</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        All messages in this conversation will be removed. This cannot be undone.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={clearing}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={clearing}>
          {clearing ? "Clearing…" : "Clear chat"}
        </Button>
      </div>
    </dialog>
  );
}
