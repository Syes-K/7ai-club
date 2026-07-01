"use client";

import { useState } from "react";
import { FlaskConical, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModelConfigDto } from "@/lib/data/types";
import {
  createModelConfig,
  deleteModelConfig,
  listModelConfigs,
  testModelConfig,
  updateModelConfigMetadata,
  updateModelConfigKey,
} from "@/lib/services/browser/model-configs";
import { ModelConfigFormDialog } from "@/components/console/model-config-form-dialog";
import { UpdateApiKeyDialog } from "@/components/console/update-api-key-dialog";
import {
  ConsolePage,
  ConsoleTable,
  ConsoleTableBody,
  ConsoleTableHead,
  ConsoleTh,
} from "@/components/console/console-page";
import { usePageBusy } from "@/components/console/use-page-busy";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: ModelConfigDto["testStatus"]): string {
  switch (status) {
    case "passed":
      return "border-[var(--accent-success)]/40 text-[var(--accent-success)]";
    case "failed":
      return "border-red-400/40 text-red-400";
    default:
      return "border-[var(--text-muted)]/40 text-[var(--text-muted)]";
  }
}

function statusLabel(status: ModelConfigDto["testStatus"]): string {
  switch (status) {
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    default:
      return "Untested";
  }
}

const MODEL_PILL_CLASS =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs";

interface ModelsManagerProps {
  initialConfigs: ModelConfigDto[];
}

export function ModelsManager({ initialConfigs }: ModelsManagerProps) {
  const { busy, busyLabel, runBusy } = usePageBusy();
  const [configs, setConfigs] = useState(initialConfigs);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ModelConfigDto | null>(null);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [keyTarget, setKeyTarget] = useState<ModelConfigDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const userConfigs = configs.filter((config) => !config.isPlatformDefault);

  async function refreshList() {
    const next = await listModelConfigs();
    setConfigs(next);
    setListError(null);
  }

  function openCreate() {
    if (busy) return;
    setFormMode("create");
    setEditing(null);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(config: ModelConfigDto) {
    if (busy) return;
    setFormMode("edit");
    setEditing(config);
    setError(null);
    setFormOpen(true);
  }

  function openKeyDialog(config: ModelConfigDto) {
    if (busy) return;
    setKeyTarget(config);
    setError(null);
    setKeyDialogOpen(true);
  }

  async function handleFormSave(values: {
    provider: string;
    modelName: string;
    modelType: import("@/lib/constants/model-types").ModelTypeId;
    embeddingDimensions?: number;
    apiKey?: string;
  }) {
    setSaving(true);
    setError(null);
    const label = formMode === "create" ? "Adding model…" : "Saving model…";

    try {
      await runBusy(label, async () => {
        if (formMode === "create") {
          await createModelConfig({
            provider: values.provider,
            modelName: values.modelName,
            modelType: values.modelType,
            embeddingDimensions: values.embeddingDimensions,
            apiKey: values.apiKey,
          });
        } else if (editing) {
          await updateModelConfigMetadata(editing.id, {
            provider: values.provider,
            modelName: values.modelName,
            embeddingDimensions:
              editing.modelType === "embedding"
                ? values.embeddingDimensions
                : undefined,
          });
        }
        setFormOpen(false);
        await refreshList();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleKeySave(apiKey: string) {
    if (!keyTarget) return;
    setSaving(true);
    setError(null);

    try {
      await runBusy("Updating API key…", async () => {
        await updateModelConfigKey(keyTarget.id, apiKey);
        setKeyDialogOpen(false);
        setKeyTarget(null);
        await refreshList();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(config: ModelConfigDto) {
    if (busy) return;
    setListError(null);
    try {
      await runBusy("Testing model…", async () => {
        await testModelConfig(config.id);
        await refreshList();
      });
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Test failed");
      try {
        await refreshList();
      } catch {
        // keep prior list
      }
    }
  }

  async function handleDelete(config: ModelConfigDto) {
    if (busy) return;
    if (!confirm(`Delete ${config.providerLabel} — ${config.modelName}?`)) {
      return;
    }
    setListError(null);
    try {
      await runBusy("Deleting model…", async () => {
        await deleteModelConfig(config.id);
        await refreshList();
      });
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <ConsolePage
      title="Model management"
      description="Configure providers, model names, API keys, and model types. Chat models power conversations; embedding models power knowledge-base vectorization."
      busy={busy}
      busyLabel={busyLabel}
      action={
        <Button onClick={openCreate} disabled={busy} className="whitespace-nowrap">
          <Plus className="h-4 w-4" />
          Add model
        </Button>
      }
    >
      {listError && <p className="mt-4 text-sm text-red-400">{listError}</p>}

      {configs.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--text-muted)]">No models configured.</p>
      ) : (
        <ConsoleTable className="table-fixed">
          <colgroup>
            <col className="w-[11%]" />
            <col className="w-[20%]" />
            <col className="w-[9%]" />
            <col className="w-[9.5rem]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col />
          </colgroup>
          <ConsoleTableHead>
            <tr>
              <ConsoleTh>Provider</ConsoleTh>
              <ConsoleTh>Model</ConsoleTh>
              <ConsoleTh>Type</ConsoleTh>
              <ConsoleTh>Source</ConsoleTh>
              <ConsoleTh>API key</ConsoleTh>
              <ConsoleTh>Test</ConsoleTh>
              <ConsoleTh>Actions</ConsoleTh>
            </tr>
          </ConsoleTableHead>
          <ConsoleTableBody>
            {configs.map((config) => (
              <tr key={config.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium">{config.providerLabel}</td>
                <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                  {config.modelName}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      MODEL_PILL_CLASS,
                      "border-[var(--neon-primary)]/25 text-[var(--text-primary)]",
                    )}
                  >
                    {config.modelTypeLabel}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {config.isPlatformDefault ? (
                    <span
                      className={cn(
                        MODEL_PILL_CLASS,
                        "border-[var(--neon-primary)]/30 text-[var(--neon-primary)]",
                      )}
                      title="Platform default"
                    >
                      Platform default
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">Custom</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {config.apiKeySet ? "Configured" : "Not set"}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <span
                      className={cn(
                        MODEL_PILL_CLASS,
                        statusBadgeClass(config.testStatus),
                      )}
                    >
                      {statusLabel(config.testStatus)}
                    </span>
                    {config.testError && (
                      <p className="max-w-xs text-xs text-red-400">{config.testError}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {config.isPlatformDefault ? (
                    <span className="text-xs text-[var(--text-muted)]">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => openEdit(config)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => openKeyDialog(config)}
                      >
                        <KeyRound className="h-4 w-4" />
                        Update key
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleTest(config)}
                      >
                        <FlaskConical className="h-4 w-4" />
                        Test
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleDelete(config)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </ConsoleTableBody>
        </ConsoleTable>
      )}

      {userConfigs.length === 0 && configs.length > 0 && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          No custom models yet. Add a model to use your own API key.
        </p>
      )}

      <ModelConfigFormDialog
        key={editing?.id ?? (formOpen ? "create" : "closed")}
        open={formOpen}
        mode={formMode}
        initial={
          editing
            ? {
                provider: editing.provider,
                modelName: editing.modelName,
                modelType: editing.modelType,
                embeddingDimensions: editing.embeddingDimensions,
              }
            : undefined
        }
        saving={saving}
        error={error}
        onSave={handleFormSave}
        onCancel={() => !saving && setFormOpen(false)}
      />

      <UpdateApiKeyDialog
        key={keyTarget?.id ?? "closed"}
        open={keyDialogOpen}
        saving={saving}
        error={error}
        onSave={handleKeySave}
        onCancel={() => {
          if (saving) return;
          setKeyDialogOpen(false);
          setKeyTarget(null);
        }}
      />
    </ConsolePage>
  );
}
