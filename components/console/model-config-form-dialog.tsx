"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConsoleSelect } from "@/components/console/console-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getProviderLabel,
  USER_LLM_PROVIDER_IDS,
} from "@/lib/constants/model-providers";
import {
  MODEL_TYPE_IDS,
  getModelTypeLabel,
  type ModelTypeId,
} from "@/lib/constants/model-types";
import type { ModelConfigDto } from "@/lib/data/types";
import type { UserLlmProviderId } from "@/lib/llm/provider";
import { DEFAULT_RAG_EMBEDDING_DIMENSIONS } from "@/lib/rag/defaults";
import { MODEL_NAME_MAX_LENGTH } from "@/lib/validation/model-config";

type FormMode = "create" | "edit";

interface ModelConfigFormDialogProps {
  open: boolean;
  mode: FormMode;
  initial?: Pick<
    ModelConfigDto,
    "provider" | "modelName" | "modelType" | "embeddingDimensions"
  >;
  saving: boolean;
  error: string | null;
  onSave: (values: {
    provider: string;
    modelName: string;
    modelType: ModelTypeId;
    embeddingDimensions?: number;
    apiKey?: string;
  }) => void;
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
  const [modelType, setModelType] = useState<ModelTypeId>(
    initial?.modelType ?? "chat",
  );
  const [embeddingDimensions, setEmbeddingDimensions] = useState(
    String(initial?.embeddingDimensions ?? DEFAULT_RAG_EMBEDDING_DIMENSIONS),
  );
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedDimensions = Number.parseInt(embeddingDimensions, 10);
    onSave({
      provider,
      modelName: modelName.trim(),
      modelType,
      embeddingDimensions:
        modelType === "embedding" ? parsedDimensions : undefined,
      apiKey: mode === "create" ? apiKey.trim() : undefined,
    });
  }

  const modelTypeOptions = MODEL_TYPE_IDS.map((id) => ({
    value: id,
    label: getModelTypeLabel(id),
  }));
  const providerOptions = USER_LLM_PROVIDER_IDS.map((id) => ({
    value: id,
    label: getProviderLabel(id),
  }));

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
          <Label htmlFor="model-type">Model type</Label>
          <ConsoleSelect
            id="model-type"
            value={modelType}
            onChange={(value) => setModelType(value as ModelTypeId)}
            disabled={mode === "edit"}
            options={modelTypeOptions}
          />
          {mode === "edit" && (
            <p className="text-xs text-[var(--text-muted)]">
              Model type cannot be changed after creation.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model-provider">Provider</Label>
          <ConsoleSelect
            id="model-provider"
            value={provider}
            onChange={(value) => setProvider(value as UserLlmProviderId)}
            options={providerOptions}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model-name">Model name</Label>
          <Input
            id="model-name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            maxLength={MODEL_NAME_MAX_LENGTH}
            placeholder={
              modelType === "embedding"
                ? "e.g. BAAI/bge-m3"
                : "e.g. qwen3.6-plus"
            }
            required
          />
        </div>

        {modelType === "embedding" && (
          <div className="space-y-2">
            <Label htmlFor="embedding-dimensions">Embedding dimensions</Label>
            <Input
              id="embedding-dimensions"
              type="number"
              min={64}
              max={8192}
              step={1}
              value={embeddingDimensions}
              onChange={(e) => setEmbeddingDimensions(e.target.value)}
              required
            />
          </div>
        )}

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
