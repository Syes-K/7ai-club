"use client";

import type { SessionListItem } from "@/lib/chat/session-api-client";

function formatUpdatedAt(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

type PanelProps = {
  sessions: SessionListItem[];
  activeId: string | null;
  busy: boolean;
  /** 正在删除的会话 id，用于禁用所有删除按钮 */
  deletingSessionId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDeleteSession: (id: string) => void;
  onRetryLoad?: () => void;
  /** 选中一项后回调（用于关闭移动抽屉） */
  afterSelect?: () => void;
};

function SessionPanelInner({
  sessions,
  activeId,
  busy,
  deletingSessionId,
  loading,
  error,
  onSelect,
  onNew,
  onDeleteSession,
  onRetryLoad,
  afterSelect,
}: PanelProps) {
  const deleteLocked = busy || deletingSessionId !== null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-zinc-200 p-3 dark:border-zinc-800">
        <button
          type="button"
          disabled={busy}
          onClick={() => onNew()}
          className="w-full rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-medium text-white outline-none ring-violet-500 hover:bg-violet-700 focus-visible:ring-2 disabled:opacity-40"
        >
          新对话
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && (
          <p className="px-2 py-3 text-xs text-zinc-500 dark:text-zinc-400">
            加载中…
          </p>
        )}
        {error && !loading && (
          <div className="space-y-2 px-2 py-2">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            {onRetryLoad && (
              <button
                type="button"
                onClick={() => onRetryLoad()}
                className="text-xs font-medium text-violet-600 underline dark:text-violet-400"
              >
                重试
              </button>
            )}
          </div>
        )}
        {!loading && !error && sessions.length === 0 && (
          <p className="px-2 py-3 text-xs text-zinc-500 dark:text-zinc-400">
            暂无会话，点击「新对话」开始
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {sessions.map((s) => {
            const active = s.id === activeId;
            return (
              <li
                key={s.id}
                className={
                  active
                    ? "flex gap-1 rounded-lg border-l-2 border-violet-500 bg-zinc-200 py-1 pl-1 dark:bg-zinc-800"
                    : "flex gap-1 rounded-lg border-l-2 border-transparent py-1 pl-1 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80"
                }
              >
                <button
                  type="button"
                  disabled={busy}
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    onSelect(s.id);
                    afterSelect?.();
                  }}
                  className="min-w-0 flex-1 rounded-md px-2 py-2 text-left text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <span className="block truncate font-medium">
                    {s.title?.trim() || "新对话"}
                  </span>
                  <span
                    className="mt-0.5 block text-[10px] text-zinc-500 dark:text-zinc-500"
                    suppressHydrationWarning
                  >
                    更新 {formatUpdatedAt(s.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={deleteLocked}
                  aria-label="删除会话"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(s.id);
                  }}
                  className="mt-0.5 shrink-0 self-start rounded-lg p-1.5 text-zinc-500 outline-none ring-violet-500 hover:bg-zinc-300/80 hover:text-red-600 focus-visible:ring-2 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-red-400"
                >
                  <TrashIcon className="shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** 桌面：固定侧栏 */
export function SessionDockedSidebar(props: PanelProps) {
  const { busy, ...rest } = props;
  return (
    <aside
      className={
        busy
          ? "pointer-events-none hidden w-56 shrink-0 select-none flex-col border-r border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-950 sm:flex"
          : "hidden w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 sm:flex"
      }
      aria-busy={busy || undefined}
    >
      <SessionPanelInner {...rest} busy={busy} />
    </aside>
  );
}

type DrawerProps = PanelProps & {
  open: boolean;
  onClose: () => void;
};

/** 窄屏：左侧抽屉 */
export function SessionDrawer({ open, onClose, onNew, busy, ...props }: DrawerProps) {
  if (!open) return null;
  return (
    <>
      <button
        type="button"
        aria-label="关闭会话列表"
        className="fixed inset-0 z-40 bg-black/40 sm:hidden"
        onClick={onClose}
      />
      <aside
        className={
          busy
            ? "pointer-events-none fixed left-0 top-0 z-50 flex h-full w-56 select-none flex-col border-r border-zinc-200 bg-zinc-50 opacity-60 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:hidden"
            : "fixed left-0 top-0 z-50 flex h-full w-56 flex-col border-r border-zinc-200 bg-zinc-50 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:hidden"
        }
        role="dialog"
        aria-modal="true"
        aria-label="会话列表"
        aria-busy={busy || undefined}
      >
        <SessionPanelInner
          {...props}
          busy={busy}
          onNew={() => {
            onNew();
            onClose();
          }}
          afterSelect={onClose}
        />
      </aside>
    </>
  );
}
