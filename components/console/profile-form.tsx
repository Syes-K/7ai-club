"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileDto } from "@/lib/data/types";
import { saveProfile } from "@/lib/services/browser/profile";

interface ProfileFormProps {
  initialProfile: ProfileDto;
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter();
  const [email] = useState(initialProfile.email);
  const [nickname, setNickname] = useState(initialProfile.nickname ?? "");
  const initialPreferredModel =
    initialProfile.preferredModel ?? initialProfile.modelOptions[0]?.id ?? "";
  const [preferredModel, setPreferredModel] = useState(initialPreferredModel);
  const [modelOptions] = useState(initialProfile.modelOptions);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const patch: { nickname?: string; preferredModel?: string | null } = {};
      if (nickname !== (initialProfile.nickname ?? "")) {
        patch.nickname = nickname;
      }
      if (preferredModel !== initialPreferredModel) {
        patch.preferredModel = preferredModel || null;
      }
      if (Object.keys(patch).length === 0) {
        setSaved(true);
        return;
      }
      await saveProfile(patch);

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-mono text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Your account details and chat preferences.
      </p>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled readOnly />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="How you appear in the app"
            maxLength={32}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferred-model">Preferred chat model</Label>
          <select
            id="preferred-model"
            value={preferredModel}
            onChange={(e) => setPreferredModel(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]"
          >
            {modelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} ({option.id})
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-[var(--accent-success)]">Saved.</p>}

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}
