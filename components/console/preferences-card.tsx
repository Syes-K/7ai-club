"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConsoleSection } from "@/components/console/console-section";
import type { ModelConfigOption } from "@/lib/data/types";
import { PLATFORM_DEFAULT_CONFIG_ID } from "@/lib/constants/model-providers";
import { savePreferences, toUiPreferredConfigId } from "@/lib/services/browser/profile";

interface PreferencesCardProps {
  initialPreferredConfigId: string | null;
  initialPreferredLabel: string;
  modelOptions: ModelConfigOption[];
}

export function PreferencesCard({
  initialPreferredConfigId,
  initialPreferredLabel,
  modelOptions,
}: PreferencesCardProps) {
  const router = useRouter();
  const initialUiId = toUiPreferredConfigId(initialPreferredConfigId);
  const [editing, setEditing] = useState(false);
  const [preferredConfigId, setPreferredConfigId] = useState(initialUiId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    if (saving) return;
    setPreferredConfigId(initialUiId);
    setEditing(false);
    setError(null);
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      if (preferredConfigId === initialUiId) {
        setSaved(true);
        setEditing(false);
        return;
      }
      await savePreferences({
        preferredModelConfigId:
          preferredConfigId === PLATFORM_DEFAULT_CONFIG_ID
            ? null
            : preferredConfigId,
      });
      setSaved(true);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConsoleSection busy={saving} busyLabel="Saving preferences…">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-lg font-semibold">Preferences</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Default model for new chat messages.
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
        <form onSubmit={handleSave} className="mt-6 space-y-4">
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
        <dl className="mt-6 text-sm">
          <dt className="text-[var(--text-muted)]">Preferred chat model</dt>
          <dd className="mt-1">{initialPreferredLabel}</dd>
          {saved && (
            <p className="mt-4 text-[var(--accent-success)]">Saved.</p>
          )}
        </dl>
      )}
    </ConsoleSection>
  );
}
