"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UpdateApiKeyDialogProps {
  open: boolean;
  saving: boolean;
  error: string | null;
  onSave: (apiKey: string) => void;
  onCancel: () => void;
}

export function UpdateApiKeyDialog({
  open,
  saving,
  error,
  onSave,
  onCancel,
}: UpdateApiKeyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(apiKey.trim());
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--neon-primary)]/30 bg-[var(--bg-elevated)] p-6 text-[var(--text-primary)] shadow-[0_0_40px_rgba(0,128,255,0.2)] backdrop:bg-black/60"
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onCancel();
      }}
      onClose={() => !saving && onCancel()}
    >
      <h2 className="font-mono text-lg font-semibold">Update API key</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Enter a new key. The previous key cannot be viewed.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="update-api-key">API key</Label>
          <Input
            id="update-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
            required
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save key"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
