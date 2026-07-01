"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsoleSection } from "@/components/console/console-section";
import type { EmbeddingModelOption, ModelConfigOption } from "@/lib/data/types";
import { parseEmbeddingModelKey } from "@/lib/console/model-configs";
import {
  PLATFORM_DEFAULT_CONFIG_ID,
  SUMMARY_SAME_AS_CHAT_ID,
} from "@/lib/constants/model-providers";
import {
  savePreferences,
  toUiPreferredConfigId,
  toUiSummaryModelConfigId,
} from "@/lib/services/browser/profile";

const EMBEDDING_CHANGE_MESSAGE =
  "Changing the embedding model affects new knowledge bases only. Existing knowledge bases keep their original model and remain searchable. To use a new embedding model with existing content, create a new knowledge base after saving. Retry ingestion does not change an existing knowledge base's embedding model.";

interface PreferencesCardProps {
  initialPreferredConfigId: string | null;
  initialPreferredLabel: string;
  initialSummarizationEnabled: boolean;
  initialSummaryTriggerTurns: number;
  initialSummaryRetainTurns: number;
  initialSummaryTriggerTokens: number;
  initialSummaryRetainTokens: number;
  initialSummaryModelConfigId: string | null;
  initialSummaryModelLabel: string;
  initialRagConfidenceThreshold: number;
  initialRagTopK: number;
  initialRagEmbeddingProvider: string;
  initialRagEmbeddingModel: string;
  initialRagEmbeddingLabel: string;
  modelOptions: ModelConfigOption[];
  embeddingModelOptions: EmbeddingModelOption[];
}

const SUMMARY_MODEL_OPTIONS = [
  { id: SUMMARY_SAME_AS_CHAT_ID, label: "Same as chat model" },
] as const;

export function PreferencesCard({
  initialPreferredConfigId,
  initialPreferredLabel,
  initialSummarizationEnabled,
  initialSummaryTriggerTurns,
  initialSummaryRetainTurns,
  initialSummaryTriggerTokens,
  initialSummaryRetainTokens,
  initialSummaryModelConfigId,
  initialSummaryModelLabel,
  initialRagConfidenceThreshold,
  initialRagTopK,
  initialRagEmbeddingProvider,
  initialRagEmbeddingModel,
  initialRagEmbeddingLabel,
  modelOptions,
  embeddingModelOptions,
}: PreferencesCardProps) {
  const router = useRouter();
  const initialUiId = toUiPreferredConfigId(initialPreferredConfigId);
  const initialSummaryUiId = toUiSummaryModelConfigId(initialSummaryModelConfigId);
  const [editing, setEditing] = useState(false);
  const [preferredConfigId, setPreferredConfigId] = useState(initialUiId);
  const [summarizationEnabled, setSummarizationEnabled] = useState(
    initialSummarizationEnabled,
  );
  const [summaryTriggerTurns, setSummaryTriggerTurns] = useState(
    String(initialSummaryTriggerTurns),
  );
  const [summaryRetainTurns, setSummaryRetainTurns] = useState(
    String(initialSummaryRetainTurns),
  );
  const [summaryTriggerTokens, setSummaryTriggerTokens] = useState(
    String(initialSummaryTriggerTokens),
  );
  const [summaryRetainTokens, setSummaryRetainTokens] = useState(
    String(initialSummaryRetainTokens),
  );
  const [summaryModelConfigId, setSummaryModelConfigId] =
    useState(initialSummaryUiId);
  const [ragConfidenceThreshold, setRagConfidenceThreshold] = useState(
    String(initialRagConfidenceThreshold),
  );
  const [ragTopK, setRagTopK] = useState(String(initialRagTopK));
  const [ragEmbeddingKey, setRagEmbeddingKey] = useState(
    `${initialRagEmbeddingProvider}:${initialRagEmbeddingModel}`,
  );
  const [embeddingConfirmOpen, setEmbeddingConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summaryModelOptions = [
    ...SUMMARY_MODEL_OPTIONS,
    ...modelOptions.map((option) => ({
      id: option.id,
      label: option.label,
    })),
  ];

  function resetForm() {
    setPreferredConfigId(initialUiId);
    setSummarizationEnabled(initialSummarizationEnabled);
    setSummaryTriggerTurns(String(initialSummaryTriggerTurns));
    setSummaryRetainTurns(String(initialSummaryRetainTurns));
    setSummaryTriggerTokens(String(initialSummaryTriggerTokens));
    setSummaryRetainTokens(String(initialSummaryRetainTokens));
    setSummaryModelConfigId(initialSummaryUiId);
    setRagConfidenceThreshold(String(initialRagConfidenceThreshold));
    setRagTopK(String(initialRagTopK));
    setRagEmbeddingKey(`${initialRagEmbeddingProvider}:${initialRagEmbeddingModel}`);
  }

  function parseEmbeddingKey(key: string): { provider: string; model: string } {
    const parsed = parseEmbeddingModelKey(key);
    if (!parsed) {
      throw new Error("Invalid embedding model selection");
    }
    return parsed;
  }

  function embeddingChanged(): boolean {
    const initialKey = `${initialRagEmbeddingProvider}:${initialRagEmbeddingModel}`;
    return ragEmbeddingKey !== initialKey;
  }

  async function persistPreferences() {
    const embedding = parseEmbeddingKey(ragEmbeddingKey);
    await savePreferences({
      preferredModelConfigId:
        preferredConfigId === PLATFORM_DEFAULT_CONFIG_ID
          ? null
          : preferredConfigId,
      summarizationEnabled,
      summaryTriggerTurns: Number(summaryTriggerTurns),
      summaryRetainTurns: Number(summaryRetainTurns),
      summaryTriggerTokens: Number(summaryTriggerTokens),
      summaryRetainTokens: Number(summaryRetainTokens),
      summaryModelConfigId:
        summaryModelConfigId === SUMMARY_SAME_AS_CHAT_ID
          ? null
          : summaryModelConfigId,
      ragConfidenceThreshold: Number(ragConfidenceThreshold),
      ragTopK: Number(ragTopK),
      ragEmbeddingProvider: embedding.provider,
      ragEmbeddingModel: embedding.model,
    });
    setSaved(true);
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    if (saving) return;
    resetForm();
    setEditing(false);
    setError(null);
    setSaved(false);
  }

  function isUnchanged(): boolean {
    return (
      preferredConfigId === initialUiId &&
      summarizationEnabled === initialSummarizationEnabled &&
      summaryTriggerTurns === String(initialSummaryTriggerTurns) &&
      summaryRetainTurns === String(initialSummaryRetainTurns) &&
      summaryTriggerTokens === String(initialSummaryTriggerTokens) &&
      summaryRetainTokens === String(initialSummaryRetainTokens) &&
      summaryModelConfigId === initialSummaryUiId &&
      ragConfidenceThreshold === String(initialRagConfidenceThreshold) &&
      ragTopK === String(initialRagTopK) &&
      ragEmbeddingKey === `${initialRagEmbeddingProvider}:${initialRagEmbeddingModel}`
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      if (isUnchanged()) {
        setSaved(true);
        setEditing(false);
        return;
      }

      if (embeddingChanged()) {
        setEmbeddingConfirmOpen(true);
        return;
      }

      await persistPreferences();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmEmbeddingChange() {
    setSaving(true);
    setError(null);

    try {
      await persistPreferences();
      setEmbeddingConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEmbeddingChange() {
    setRagEmbeddingKey(`${initialRagEmbeddingProvider}:${initialRagEmbeddingModel}`);
    setEmbeddingConfirmOpen(false);
    setSaving(false);
  }

  const memoryDisabled = !summarizationEnabled;

  return (
    <ConsoleSection busy={saving} busyLabel="Saving preferences…">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-lg font-semibold">Preferences</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Default chat model, conversation memory, and RAG retrieval settings.
          </p>
        </div>
        {!editing && modelOptions.length > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      {modelOptions.length === 0 ? (
        <div className="mt-6 text-sm text-[var(--text-muted)]">
          <p>No tested models available.</p>
          <Link
            href="/console/models"
            className="mt-2 inline-block text-[var(--neon-primary)] hover:underline"
          >
            Go to Model management
          </Link>
        </div>
      ) : editing ? (
        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="preferred-model">Preferred chat model</Label>
            <select
              id="preferred-model"
              value={preferredConfigId}
              onChange={(e) => setPreferredConfigId(e.target.value)}
              disabled={saving}
              className="flex h-10 w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)] disabled:opacity-60"
            >
              {modelOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 border-t border-[var(--neon-primary)]/15 pt-6">
            <div>
              <h3 className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                Conversation memory
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Rolling summaries keep long chats within model context limits.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="summarization-enabled"
                type="checkbox"
                checked={summarizationEnabled}
                onChange={(e) => setSummarizationEnabled(e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-[var(--neon-primary)]/40 accent-[var(--neon-primary)]"
              />
              <Label htmlFor="summarization-enabled">Enable summarization</Label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="summary-trigger-turns">Trigger turn count</Label>
                <Input
                  id="summary-trigger-turns"
                  type="number"
                  min={1}
                  step={1}
                  value={summaryTriggerTurns}
                  onChange={(e) => setSummaryTriggerTurns(e.target.value)}
                  disabled={saving || memoryDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary-retain-turns">Retain turn count</Label>
                <Input
                  id="summary-retain-turns"
                  type="number"
                  min={0}
                  step={1}
                  value={summaryRetainTurns}
                  onChange={(e) => setSummaryRetainTurns(e.target.value)}
                  disabled={saving || memoryDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary-trigger-tokens">Trigger token count</Label>
                <Input
                  id="summary-trigger-tokens"
                  type="number"
                  min={1}
                  step={1}
                  value={summaryTriggerTokens}
                  onChange={(e) => setSummaryTriggerTokens(e.target.value)}
                  disabled={saving || memoryDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary-retain-tokens">Retain token count</Label>
                <Input
                  id="summary-retain-tokens"
                  type="number"
                  min={1}
                  step={1}
                  value={summaryRetainTokens}
                  onChange={(e) => setSummaryRetainTokens(e.target.value)}
                  disabled={saving || memoryDisabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary-model">Summary model</Label>
              <select
                id="summary-model"
                value={summaryModelConfigId}
                onChange={(e) => setSummaryModelConfigId(e.target.value)}
                disabled={saving || memoryDisabled}
                className="flex h-10 w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)] disabled:opacity-60"
              >
                {summaryModelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4 border-t border-[var(--neon-primary)]/15 pt-6">
            <div>
              <h3 className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                RAG retrieval
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Controls knowledge recall in chat and recall tests.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rag-confidence">Confidence threshold</Label>
                <Input
                  id="rag-confidence"
                  type="number"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={ragConfidenceThreshold}
                  onChange={(e) => setRagConfidenceThreshold(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rag-top-k">Top K</Label>
                <Input
                  id="rag-top-k"
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={ragTopK}
                  onChange={(e) => setRagTopK(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rag-embedding-model">Embedding model</Label>
              <select
                id="rag-embedding-model"
                value={ragEmbeddingKey}
                onChange={(e) => setRagEmbeddingKey(e.target.value)}
                disabled={saving}
                className="flex h-10 w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)] disabled:opacity-60"
              >
                {embeddingModelOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {saved && <p className="text-sm text-[var(--accent-success)]">Saved.</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <dl className="mt-6 space-y-6 text-sm">
          <div>
            <dt className="text-[var(--text-muted)]">Preferred chat model</dt>
            <dd className="mt-1">{initialPreferredLabel}</dd>
          </div>

          <div>
            <dt className="font-mono text-[var(--text-primary)]">Conversation memory</dt>
            <dd className="mt-3 space-y-1">
              <p>
                <span className="text-[var(--text-muted)]">Summarization: </span>
                {initialSummarizationEnabled ? "Enabled" : "Disabled"}
              </p>
              <p>
                <span className="text-[var(--text-muted)]">Trigger: </span>
                {initialSummaryTriggerTurns} turns / {initialSummaryTriggerTokens} tokens
              </p>
              <p>
                <span className="text-[var(--text-muted)]">Retain: </span>
                {initialSummaryRetainTurns} turns / {initialSummaryRetainTokens} tokens
              </p>
              <p>
                <span className="text-[var(--text-muted)]">Summary model: </span>
                {initialSummaryModelLabel}
              </p>
            </dd>
          </div>

          <div>
            <dt className="font-mono text-[var(--text-primary)]">RAG retrieval</dt>
            <dd className="mt-3 space-y-1">
              <p>
                <span className="text-[var(--text-muted)]">Confidence threshold: </span>
                {initialRagConfidenceThreshold}
              </p>
              <p>
                <span className="text-[var(--text-muted)]">Top K: </span>
                {initialRagTopK}
              </p>
              <p>
                <span className="text-[var(--text-muted)]">Embedding model: </span>
                {initialRagEmbeddingLabel}
              </p>
            </dd>
          </div>

          {saved && (
            <p className="text-[var(--accent-success)]">Saved.</p>
          )}
        </dl>
      )}

      {embeddingConfirmOpen && (
        <dialog
          open
          className="fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--neon-primary)]/30 bg-[var(--bg-elevated)] p-6 text-[var(--text-primary)] shadow-[0_0_40px_rgba(0,128,255,0.2)] backdrop:bg-black/60"
        >
          <h3 className="font-mono text-lg font-semibold">Change embedding model?</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {EMBEDDING_CHANGE_MESSAGE}
          </p>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={handleCancelEmbeddingChange}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmEmbeddingChange} disabled={saving}>
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </dialog>
      )}
    </ConsoleSection>
  );
}
