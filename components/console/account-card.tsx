"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsoleSection } from "@/components/console/console-section";
import { saveAccount } from "@/lib/services/browser/profile";

interface AccountCardProps {
  email: string;
  initialNickname: string | null;
}

export function AccountCard({ email, initialNickname }: AccountCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(initialNickname ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    if (saving) return;
    setNickname(initialNickname ?? "");
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
      if (nickname === (initialNickname ?? "")) {
        setSaved(true);
        setEditing(false);
        return;
      }
      await saveAccount({ nickname });
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
    <ConsoleSection busy={saving} busyLabel="Saving account…">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-lg font-semibold">Account</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Your sign-in email and display nickname.
          </p>
        </div>
        {!editing && (
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

      {editing ? (
        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input id="account-email" value={email} disabled readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-nickname">Nickname</Label>
            <Input
              id="account-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="How you appear in the app"
              maxLength={32}
              disabled={saving}
            />
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
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-[var(--text-muted)]">Email</dt>
            <dd className="mt-1">{email}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Nickname</dt>
            <dd className="mt-1">{initialNickname?.trim() || "—"}</dd>
          </div>
          {saved && <p className="text-[var(--accent-success)]">Saved.</p>}
        </dl>
      )}
    </ConsoleSection>
  );
}
