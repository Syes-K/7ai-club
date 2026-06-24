"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getProviderLabel,
  USER_LLM_PROVIDER_IDS,
} from "@/lib/constants/model-providers";
import type { ModelConfigDto } from "@/lib/data/types";
import type { UserLlmProviderId } from "@/lib/llm/provider";
import { MODEL_NAME_MAX_LENGTH } from "@/lib/validation/model-config";

type FormMode = "create" | "edit";

interface ModelConfigFormDialogProps {
  open: boolean;
  mode: FormMode;
  initial?: Pick<ModelConfigDto, "provider" | "modelName">;
  saving: boolean;
  error: string | null;
  onSave: (values: { provider: string; modelName: string; apiKey?: string }) => void;
  onCancel: () => void;
}

export function ModelConfigFormDialog({
  open,
  mode,
  initial,
  saving,
  error,
  onSave,
  onCancel,
}: ModelConfigFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [provider, setProvider] = useState<UserLlmProviderId>(
    initial?.provider ?? "bailian",
  );
  const [modelName, setModelName] = useState(initial?.modelName ?? "");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      provider,
      modelName: modelName.trim(),
      apiKey: mode === "create" ? apiKey.trim() : undefined,
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
        {mode === "create" ? "Add model" : "Edit model"}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="model-provider">Provider</Label>
          <select
            id="model-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as UserLlmProviderId)}
            className="flex h-10 w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]"
          >
            {USER_LLM_PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {getProviderLabel(id)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model-name">Model name</Label>
          <Input
            id="model-name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            maxLength={MODEL_NAME_MAX_LENGTH}
            placeholder="e.g. qwen3.6-plus"
            required
          />
        </div>

        {mode === "create" && (
          <div className="space-y-2">
            <Label htmlFor="model-api-key">API key</Label>
            <Input
              id="model-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Add model" : "Save"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
