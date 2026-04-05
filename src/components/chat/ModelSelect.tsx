"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DEEPSEEK_DEFAULT_MODEL } from "@/lib/provider/constants";
import { MODEL_GROUPS } from "@/lib/provider/models";
import type { ModelOption } from "@/lib/provider/models";

function findModelById(id: string): ModelOption | undefined {
  for (const g of MODEL_GROUPS) {
    const m = g.models.find((o) => o.id === id);
    if (m) return m;
  }
  return undefined;
}

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

type ModelSelectProps = {
  value: string;
  disabled?: boolean;
  onChange: (modelId: string) => void;
  /** 与 label[htmlFor] 对应 */
  id?: string;
  /** `above`：在输入区底部时使用，列表向上展开避免被裁切 */
  dropdownPlacement?: "above" | "below";
  /** 外层容器，默认 `relative min-w-0 flex-1` */
  className?: string;
};

/**
 * 仅展示模型 label；hint 通过原生 `title` 在悬停选项时出现。
 */
export function ModelSelect({
  value,
  disabled,
  onChange,
  id,
  dropdownPlacement = "below",
  className: wrapperClassName,
}: ModelSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const current = findModelById(value);
  const displayLabel =
    current?.label ?? (value === DEEPSEEK_DEFAULT_MODEL ? "DeepSeek" : value);

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
    (modelId: string) => {
      onChange(modelId);
      setOpen(false);
    },
    [onChange]
  );

  const wrap =
    wrapperClassName ?? "relative min-w-0 flex-1";

  return (
    <div ref={rootRef} className={wrap}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="flex w-full min-w-0 max-w-full items-center justify-between gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-left text-xs font-medium text-zinc-900 shadow-sm outline-none transition-colors hover:border-violet-300 hover:bg-violet-50/40 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-violet-600 dark:hover:bg-violet-950/35"
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        <ChevronDownIcon
          className={`shrink-0 text-zinc-500 transition-transform dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="选择模型"
          className={
            dropdownPlacement === "above"
              ? "absolute bottom-full left-0 right-0 z-[80] mb-1 max-h-[min(22rem,45vh)] w-full min-w-0 overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-200/90 bg-white py-1 shadow-lg ring-1 ring-zinc-950/5 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/10"
              : "absolute left-0 right-0 top-full z-[80] mt-1 max-h-[min(22rem,70vh)] w-full min-w-0 overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-200/90 bg-white py-1 shadow-lg ring-1 ring-zinc-950/5 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/10"
          }
        >
          {MODEL_GROUPS.map((group) => (
            <div key={group.label} className="border-b border-zinc-100 py-1 last:border-b-0 dark:border-zinc-800">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {group.label}
              </div>
              <div className="space-y-0.5 px-1 pb-1">
                {group.models.map((opt) => {
                  const selected = value === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      title={opt.hint}
                      aria-selected={selected}
                      onClick={() => pick(opt.id)}
                      className={
                        selected
                          ? "flex w-full rounded-lg bg-violet-100 px-2.5 py-2 text-left text-sm font-medium text-violet-900 outline-none dark:bg-violet-950/55 dark:text-violet-200"
                          : "flex w-full rounded-lg px-2.5 py-2 text-left text-sm text-zinc-800 outline-none ring-violet-500 hover:bg-violet-50 hover:text-violet-900 focus-visible:ring-2 dark:text-zinc-200 dark:hover:bg-violet-950/40 dark:hover:text-violet-100"
                      }
                    >
                      <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
