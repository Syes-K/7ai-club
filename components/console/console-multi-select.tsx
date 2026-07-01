"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConsoleMultiSelectOption = {
  value: string;
  label: string;
};

interface ConsoleMultiSelectProps {
  id?: string;
  options: ConsoleMultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

function buildTriggerLabel(
  options: ConsoleMultiSelectOption[],
  value: string[],
  placeholder: string,
): string {
  if (value.length === 0) {
    return placeholder;
  }

  const labels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  if (labels.length === 1) {
    return labels[0] ?? placeholder;
  }

  return `${labels.length} selected`;
}

export function ConsoleMultiSelect({
  id,
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "Select…",
}: ConsoleMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggleOption(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    );
  }

  const triggerLabel = buildTriggerLabel(options, value, placeholder);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          value.length === 0 && "text-[var(--text-muted)]",
        )}
      >
        <span className="truncate text-left">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-elevated)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          {options.map((option) => {
            const checked = value.includes(option.value);
            return (
              <label
                key={option.value}
                role="option"
                aria-selected={checked}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOption(option.value)}
                  disabled={disabled}
                  className="h-4 w-4 shrink-0 rounded border-[var(--neon-primary)]/40 accent-[var(--neon-primary)]"
                />
                <span className="truncate">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
