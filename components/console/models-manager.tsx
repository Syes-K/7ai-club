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
import { ModelTestFailureDialog } from "@/components/console/model-test-failure-dialog";
import { ModelTestStatusCell, MODEL_PILL_CLASS } from "@/components/console/model-test-status";
import { UpdateApiKeyDialog } from "@/components/console/update-api-key-dialog";
import { useModelConnectivityTest } from "@/components/console/use-model-connectivity-test";
import {
  ConsolePage,
  ConsoleTable,
  ConsoleTableBody,
  ConsoleTableHead,
  ConsoleTh,
} from "@/components/console/console-page";
import {
  CONSOLE_TABLE_ACTIONS_CELL_13,
  CONSOLE_TABLE_ACTIONS_HEAD_13,
  CONSOLE_TABLE_ACTION_BUTTON_CLASS,
  CONSOLE_TABLE_ACTIONS_WRAP_13,
} from "@/components/console/console-table-actions";
import { usePageBusy } from "@/components/console/use-page-busy";
import { cn } from "@/lib/utils";

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

  const { testFailure, testFailureOpen, closeTestFailure, handleTest } =
    useModelConnectivityTest({ busy, runBusy, refreshList });

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
            <col className="w-[22%]" />
            <col className="w-[9%]" />
            <col className="w-[9.5rem]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[13rem]" />
          </colgroup>
          <ConsoleTableHead>
            <tr>
              <ConsoleTh>Provider</ConsoleTh>
              <ConsoleTh>Model</ConsoleTh>
              <ConsoleTh>Type</ConsoleTh>
              <ConsoleTh>Source</ConsoleTh>
              <ConsoleTh>API key</ConsoleTh>
              <ConsoleTh>Test</ConsoleTh>
              <ConsoleTh className={CONSOLE_TABLE_ACTIONS_HEAD_13}>Actions</ConsoleTh>
            </tr>
          </ConsoleTableHead>
          <ConsoleTableBody>
            {configs.map((config) => (
              <tr key={config.id} className="group hover:bg-white/[0.02]">
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
                      title="Platform-managed model"
                    >
                      Platform
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">Custom</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {config.apiKeySet ? "Configured" : "Not set"}
                </td>
                <ModelTestStatusCell config={config} />
                <td className={CONSOLE_TABLE_ACTIONS_CELL_13}>
                  {config.isPlatformDefault ? (
                    <span className="text-xs text-[var(--text-muted)]">—</span>
                  ) : (
                    <div className={CONSOLE_TABLE_ACTIONS_WRAP_13}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => openEdit(config)}
                        className={CONSOLE_TABLE_ACTION_BUTTON_CLASS}
                      >
                        <Pencil className="h-3.5 w-3.5 shrink-0" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => openKeyDialog(config)}
                        className={CONSOLE_TABLE_ACTION_BUTTON_CLASS}
                      >
                        <KeyRound className="h-3.5 w-3.5 shrink-0" />
                        Update key
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleTest(config, testModelConfig)}
                        className={CONSOLE_TABLE_ACTION_BUTTON_CLASS}
                      >
                        <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                        Test
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleDelete(config)}
                        className={cn(
                          CONSOLE_TABLE_ACTION_BUTTON_CLASS,
                          "text-red-400 hover:text-red-300",
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
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

      <ModelTestFailureDialog
        open={testFailureOpen}
        failure={testFailure}
        onClose={closeTestFailure}
      />
    </ConsolePage>
  );
}
