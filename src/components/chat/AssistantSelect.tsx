"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { AssistantPublicItem } from "@/lib/assistants/types";

function ChevronDownIcon({ className }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function emojiOf(a: AssistantPublicItem): string {
  return a.iconEmoji?.trim() || "🤖";
}

export type AssistantSelectProps = {
  assistants: AssistantPublicItem[];
  value: string;
  onChange: (assistantId: string) => void;
  disabled?: boolean;
  /** 拉取列表中：禁用并显示占位 */
  loading?: boolean;
  id?: string;
  className?: string;
};

export function AssistantSelect({
  assistants,
  value,
  onChange,
  disabled,
  loading,
  id,
  className: wrapperClassName,
}: AssistantSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected =
    value === ""
      ? null
      : (assistants.find((a) => a.id === value) ?? null);

  const displayPrimary =
    loading
      ? "加载助手列表…"
      : value === ""
        ? "无助手"
        : selected
          ? `${emojiOf(selected)} ${selected.name}`
          : "未知助手";

  const displaySecondary =
    !loading && value === ""
      ? "不附加助手设定与开场白"
      : !loading && selected && (selected.openingMessage ?? "").trim()
        ? "已设开场白"
        : null;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = useCallback(
    (assistantId: string) => {
      onChange(assistantId);
      setOpen(false);
    },
    [onChange]
  );

  const busy = disabled || loading;
  const wrap = wrapperClassName ?? "relative w-full min-w-0";

  return (
    <div ref={rootRef} className={wrap}>
      <button
        type="button"
        id={id}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => !busy && setOpen((o) => !o)}
        className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-left shadow-sm outline-none ring-violet-500/0 transition-[border-color,box-shadow,background-color] hover:border-violet-300/80 hover:bg-violet-50/50 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950/80 dark:hover:border-violet-500/50 dark:hover:bg-violet-950/25"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {displayPrimary}
          </div>
          {displaySecondary && (
            <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {displaySecondary}
            </div>
          )}
        </div>
        <ChevronDownIcon
          className={`shrink-0 text-zinc-500 transition-transform dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !busy && (
        <div
          id={listId}
          role="listbox"
          aria-label="选择助手"
          className="absolute left-0 right-0 top-full z-[120] mt-1.5 max-h-[min(20rem,55vh)] w-full overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-200/90 bg-white py-1.5 shadow-lg ring-1 ring-zinc-950/5 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/10"
        >
          <div className="px-1.5 pb-1">
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              onClick={() => pick("")}
              className={
                value === ""
                  ? "flex w-full items-start gap-3 rounded-lg bg-violet-100 px-2.5 py-2.5 text-left outline-none dark:bg-violet-950/55"
                  : "flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left outline-none ring-violet-500 hover:bg-violet-50 focus-visible:ring-2 dark:hover:bg-violet-950/40"
              }
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-lg leading-none dark:bg-zinc-800"
                aria-hidden
              >
                ✨
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={
                    value === ""
                      ? "block text-sm font-medium text-violet-900 dark:text-violet-200"
                      : "block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  }
                >
                  无助手
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                  不附加助手设定与开场白
                </span>
              </span>
            </button>
          </div>

          {assistants.length > 0 && (
            <div className="border-t border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
              <div className="px-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                我的助手
              </div>
              <div className="space-y-0.5 px-1">
                {assistants.map((a) => {
                  const sel = value === a.id;
                  const om = (a.openingMessage ?? "").trim();
                  return (
                    <button
                      key={a.id}
                      type="button"
                      role="option"
                      aria-selected={sel}
                      onClick={() => pick(a.id)}
                      className={
                        sel
                          ? "flex w-full items-start gap-3 rounded-lg bg-violet-100 px-2.5 py-2 text-left outline-none dark:bg-violet-950/55"
                          : "flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left outline-none ring-violet-500 hover:bg-violet-50 focus-visible:ring-2 dark:hover:bg-violet-950/40"
                      }
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-lg dark:bg-zinc-800"
                        aria-hidden
                      >
                        {emojiOf(a)}
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span
                          className={
                            sel
                              ? "block truncate text-sm font-medium text-violet-900 dark:text-violet-200"
                              : "block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100"
                          }
                        >
                          {a.name}
                        </span>
                        {om ? (
                          <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                            开场白：{om.length > 48 ? `${om.slice(0, 48)}…` : om}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
