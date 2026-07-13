"use client";

import { useState } from "react";
import { FlaskConical, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModelConfigDto } from "@/lib/data/types";
import {
  createAdminPlatformModel,
  deleteAdminPlatformModel,
  disableAdminPlatformModel,
  enableAdminPlatformModel,
  listAdminPlatformModels,
  testAdminPlatformModel,
  updateAdminPlatformModelKey,
  updateAdminPlatformModelMetadata,
} from "@/lib/services/browser/admin-platform-models";
import { ModelConfigFormDialog } from "@/components/console/model-config-form-dialog";
import { ModelTestFailureDialog } from "@/components/console/model-test-failure-dialog";
import { ModelTestStatusCell } from "@/components/console/model-test-status";
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
  CONSOLE_TABLE_ACTIONS_WRAP_13,
} from "@/components/console/console-table-actions";
import { usePageBusy } from "@/components/console/use-page-busy";
import { cn } from "@/lib/utils";

interface PlatformModelsManagerProps {
  initialConfigs: ModelConfigDto[];
}

export function PlatformModelsManager({ initialConfigs }: PlatformModelsManagerProps) {
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

  async function refreshList() {
    const next = await listAdminPlatformModels();
    setConfigs(next);
    setListError(null);
  }

  const { testFailure, testFailureOpen, closeTestFailure, handleTest } =
    useModelConnectivityTest({ busy, runBusy, refreshList });

  async function handleFormSave(values: {
    provider: string;
    modelName: string;
    modelType: import("@/lib/constants/model-types").ModelTypeId;
    embeddingDimensions?: number;
    apiKey?: string;
  }) {
    setSaving(true);
    setError(null);
    try {
      await runBusy(formMode === "create" ? "Adding model…" : "Saving model…", async () => {
        if (formMode === "create") {
          await createAdminPlatformModel({
            provider: values.provider,
            modelName: values.modelName,
            modelType: values.modelType,
            embeddingDimensions: values.embeddingDimensions,
            apiKey: values.apiKey,
          });
        } else if (editing) {
          await updateAdminPlatformModelMetadata(editing.id, {
            provider: values.provider,
            modelName: values.modelName,
            embeddingDimensions:
              editing.modelType === "embedding" ? values.embeddingDimensions : undefined,
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

  return (
    <ConsolePage
      title="Platform models"
      description="Free models offered to all users. Keys are encrypted server-side."
      busy={busy}
      busyLabel={busyLabel}
      action={
        <Button onClick={() => { setFormMode("create"); setEditing(null); setFormOpen(true); }} disabled={busy}>
          <Plus className="h-4 w-4" />
          Add platform model
        </Button>
      }
    >
      {listError && <p className="mt-4 text-sm text-red-400">{listError}</p>}
      <ConsoleTable className="mt-4">
        <ConsoleTableHead>
          <tr>
            <ConsoleTh>Provider</ConsoleTh>
            <ConsoleTh>Model</ConsoleTh>
            <ConsoleTh>Type</ConsoleTh>
            <ConsoleTh>Status</ConsoleTh>
            <ConsoleTh>Test</ConsoleTh>
            <ConsoleTh className={CONSOLE_TABLE_ACTIONS_HEAD_13}>Actions</ConsoleTh>
          </tr>
        </ConsoleTableHead>
        <ConsoleTableBody>
          {configs.map((config) => (
            <tr key={config.id}>
              <td className="px-4 py-3">{config.providerLabel}</td>
              <td className="px-4 py-3 font-mono">{config.modelName}</td>
              <td className="px-4 py-3">{config.modelTypeLabel}</td>
              <td className="px-4 py-3 text-sm">
                {config.enabled === false ? "Disabled" : "Enabled"}
              </td>
              <ModelTestStatusCell config={config} />
              <td className={CONSOLE_TABLE_ACTIONS_CELL_13}>
                <div className={CONSOLE_TABLE_ACTIONS_WRAP_13}>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setEditing(config); setFormMode("edit"); setFormOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setKeyTarget(config); setKeyDialogOpen(true); }}>
                    <KeyRound className="h-3.5 w-3.5" /> Key
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => void handleTest(config, testAdminPlatformModel)}>
                    <FlaskConical className="h-3.5 w-3.5" /> Test
                  </Button>
                  {config.enabled === false ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        void runBusy("Enabling…", async () => {
                          await enableAdminPlatformModel(config.id);
                          await refreshList();
                        })
                      }
                    >
                      Enable
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => void runBusy("Disabling…", async () => { await disableAdminPlatformModel(config.id); await refreshList(); })}>
                      Disable
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" disabled={busy} className={cn("text-red-400")} onClick={() => void runBusy("Deleting…", async () => { await deleteAdminPlatformModel(config.id); await refreshList(); })}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </ConsoleTableBody>
      </ConsoleTable>

      <ModelConfigFormDialog
        key={editing?.id ?? (formOpen ? "create" : "closed")}
        open={formOpen}
        mode={formMode}
        initial={editing ? { provider: editing.provider, modelName: editing.modelName, modelType: editing.modelType, embeddingDimensions: editing.embeddingDimensions } : undefined}
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
        onSave={async (apiKey) => {
          if (!keyTarget) return;
          setSaving(true);
          try {
            await runBusy("Updating key…", async () => {
              await updateAdminPlatformModelKey(keyTarget.id, apiKey);
              setKeyDialogOpen(false);
              setKeyTarget(null);
              await refreshList();
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
          } finally {
            setSaving(false);
          }
        }}
        onCancel={() => { if (!saving) { setKeyDialogOpen(false); setKeyTarget(null); } }}
      />

      <ModelTestFailureDialog
        open={testFailureOpen}
        failure={testFailure}
        onClose={closeTestFailure}
      />
    </ConsolePage>
  );
}
