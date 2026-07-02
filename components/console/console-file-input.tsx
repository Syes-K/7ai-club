"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConsoleFileInputProps = {
  id: string;
  accept?: string;
  disabled?: boolean;
  required?: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
  emptyLabel?: string;
  className?: string;
};

/** English file picker — hides locale-dependent native button text (e.g. 选择文件). */
export function ConsoleFileInput({
  id,
  accept,
  disabled,
  required,
  file,
  onFileChange,
  emptyLabel = "No file selected",
  className,
}: ConsoleFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        required={required}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      <div className="flex min-h-10 flex-wrap items-center gap-3 rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-base)] px-3 py-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        <span className="min-w-0 truncate text-sm text-[var(--text-muted)]">
          {file?.name ?? emptyLabel}
        </span>
      </div>
    </div>
  );
}
