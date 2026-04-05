"use client";

import { useEffect, useState } from "react";
import {
  apiCreateSession,
  apiListAssistantsPublic,
} from "@/lib/chat/session-api-client";
import type { AssistantPublicItem } from "@/lib/assistants/types";
import { AssistantSelect } from "./AssistantSelect";

export function NewSessionAssistantModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (sessionId: string) => void | Promise<void>;
}) {
  const [listLoading, setListLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistants, setAssistants] = useState<AssistantPublicItem[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedId("");
    setListLoading(true);
    void apiListAssistantsPublic()
      .then((rows) => setAssistants(rows))
      .catch(() => {
        setAssistants([]);
        setError("无法加载助手列表");
      })
      .finally(() => setListLoading(false));
  }, [open]);

  if (!open) return null;

  const confirm = async () => {
    setCreateLoading(true);
    setError(null);
    try {
      const id =
        selectedId.trim() === ""
          ? await apiCreateSession()
          : await apiCreateSession(selectedId);
      await onCreated(id);
      onClose();
    } catch {
      setError("创建会话失败，请重试");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      {/* 勿用 overflow-hidden：会裁切助手下拉面板的「我的助手」及以下选项 */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-950/10 ring-1 ring-zinc-950/5 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40 dark:ring-white/5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-session-assistant-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-t-2xl border-b border-zinc-100 bg-gradient-to-br from-violet-50/90 to-white px-6 pb-5 pt-6 dark:border-zinc-800 dark:from-violet-950/35 dark:to-zinc-900">
          <h2
            id="new-session-assistant-title"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            新建会话
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            选择助手（可选）；创建后不可更换。
          </p>
        </div>
        <div className="rounded-b-2xl px-6 pb-6 pt-5">
          <label
            htmlFor="new-session-assistant-select"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            助手
          </label>
          <AssistantSelect
            id="new-session-assistant-select"
            assistants={assistants}
            value={selectedId}
            loading={listLoading}
            disabled={createLoading}
            onChange={setSelectedId}
          />
          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 outline-none ring-violet-500 transition-colors hover:bg-zinc-100 focus-visible:ring-2 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={onClose}
              disabled={createLoading}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm outline-none ring-violet-500 transition-colors hover:bg-violet-700 focus-visible:ring-2 disabled:opacity-50"
              onClick={() => void confirm()}
              disabled={createLoading || listLoading}
            >
              {createLoading ? "创建中…" : "创建会话"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
