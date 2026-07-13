"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { AdminUserRow } from "@/lib/admin/users";

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  return text || `Request failed (${response.status})`;
}

export function UsersManager() {
  const { busy, busyLabel, runBusy } = usePageBusy();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (query?: string) => {
      const params = new URLSearchParams({ page: "1", perPage: "20" });
      if (query?.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error(await readError(response));
      const data = (await response.json()) as { users: AdminUserRow[] };
      setUsers(data.users);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void runBusy("Loading users…", async () => {
      await load();
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [load, runBusy]);

  async function runAction(
    userId: string,
    path: string,
    label: string,
  ): Promise<void> {
    setBusyId(userId);
    setError(null);
    try {
      const response = await fetch(path, { method: "POST" });
      if (!response.ok) throw new Error(await readError(response));
      await load(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : label);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ConsolePage
      title="Users"
      description="Site-wide user accounts. Disable or re-enable accounts."
      busy={busy}
      busyLabel={busyLabel}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or nickname"
          className="max-w-sm"
        />
        <Button
          variant="secondary"
          onClick={() => void runBusy("Searching…", () => load(q))}
          disabled={busy}
        >
          Search
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {!busy && users.length === 0 && (
        <p className="text-sm text-[var(--text-muted)]">No users found.</p>
      )}

      {!busy && users.length > 0 && (
        <ConsoleTable>
          <ConsoleTableHead>
            <tr>
              <ConsoleTh>Email</ConsoleTh>
              <ConsoleTh>Nickname</ConsoleTh>
              <ConsoleTh>Status</ConsoleTh>
              <ConsoleTh>Assistants</ConsoleTh>
              <ConsoleTh>Chats</ConsoleTh>
              <ConsoleTh className={CONSOLE_TABLE_ACTIONS_HEAD_13}>Actions</ConsoleTh>
            </tr>
          </ConsoleTableHead>
          <ConsoleTableBody>
            {users.map((user) => (
              <tr key={user.id} className="group hover:bg-white/[0.02]">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {user.nickname ?? "—"}
                </td>
                <td className="px-4 py-3">{user.status}</td>
                <td className="px-4 py-3">{user.assistantCount}</td>
                <td className="px-4 py-3">{user.conversationCount}</td>
                <td className={CONSOLE_TABLE_ACTIONS_CELL_13}>
                  <div className={CONSOLE_TABLE_ACTIONS_WRAP_13}>
                    {user.status === "Disabled" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyId === user.id}
                        className={CONSOLE_TABLE_ACTION_BUTTON_CLASS}
                        onClick={() =>
                          void runAction(
                            user.id,
                            `/api/admin/users/${user.id}/enable`,
                            "Enable failed",
                          )
                        }
                      >
                        <UserCheck className="h-3.5 w-3.5 shrink-0" />
                        Enable
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyId === user.id}
                        className={CONSOLE_TABLE_ACTION_BUTTON_CLASS}
                        onClick={() =>
                          void runAction(
                            user.id,
                            `/api/admin/users/${user.id}/disable`,
                            "Disable failed",
                          )
                        }
                      >
                        <Ban className="h-3.5 w-3.5 shrink-0" />
                        Disable
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </ConsoleTableBody>
        </ConsoleTable>
      )}
    </ConsolePage>
  );
}
