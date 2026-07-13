"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export type ModelTestFailure = {
  modelLabel: string;
  message: string;
};

interface ModelTestFailureDialogProps {
  open: boolean;
  failure: ModelTestFailure | null;
  onClose: () => void;
}

export function ModelTestFailureDialog({
  open,
  failure,
  onClose,
}: ModelTestFailureDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && failure && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open, failure]);

  if (!failure) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-red-400/30 bg-[var(--bg-elevated)] p-6 text-[var(--text-primary)] shadow-[0_0_40px_rgba(248,113,113,0.15)] backdrop:bg-black/60"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <h2 className="font-mono text-lg font-semibold text-red-400">Model test failed</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{failure.modelLabel}</p>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm text-[var(--text-primary)]">
        {failure.message}
      </p>
      <div className="mt-6 flex justify-end">
        <Button type="button" onClick={onClose}>
          Close
        </Button>
      </div>
    </dialog>
  );
}
