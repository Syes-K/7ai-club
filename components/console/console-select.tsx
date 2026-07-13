"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ConsoleSelectOption = {
  value: string;
  label: string;
};

export type ConsoleSelectGroup = {
  label: string;
  options: ConsoleSelectOption[];
};

interface ConsoleSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  options?: ConsoleSelectOption[];
  leadingOptions?: ConsoleSelectOption[];
  groups?: ConsoleSelectGroup[];
}

const TRIGGER_CLASS =
  "h-10 w-full border-[var(--neon-primary)]/25 bg-[var(--bg-base)] text-[var(--text-primary)] focus-visible:border-[var(--neon-primary)] focus-visible:ring-[var(--neon-primary)]/50 dark:bg-[var(--bg-base)] dark:hover:bg-[var(--bg-base)]";

const CONTENT_CLASS =
  "max-h-60 border-[var(--neon-primary)]/25 bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-[var(--neon-primary)]/15";

function collectItems(
  options: ConsoleSelectOption[] | undefined,
  leadingOptions: ConsoleSelectOption[] | undefined,
  groups: ConsoleSelectGroup[] | undefined,
): ConsoleSelectOption[] {
  return [
    ...(leadingOptions ?? []),
    ...(options ?? []),
    ...(groups?.flatMap((group) => group.options) ?? []),
  ];
}

function renderItems(options: ConsoleSelectOption[]) {
  return options.map((option) => (
    <SelectItem key={option.value} value={option.value}>
      {option.label}
    </SelectItem>
  ));
}

export function ConsoleSelect({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "Select…",
  options,
  leadingOptions,
  groups,
}: ConsoleSelectProps) {
  const items = collectItems(options, leadingOptions, groups);
  const hasLeading = (leadingOptions?.length ?? 0) > 0;
  const hasFlat = (options?.length ?? 0) > 0;
  const hasGroups = (groups?.length ?? 0) > 0;

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next != null) onChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={TRIGGER_CLASS}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={CONTENT_CLASS} alignItemWithTrigger={false}>
        {hasLeading && (
          <SelectGroup>{renderItems(leadingOptions ?? [])}</SelectGroup>
        )}
        {hasLeading && (hasFlat || hasGroups) && <SelectSeparator />}
        {hasFlat && <SelectGroup>{renderItems(options ?? [])}</SelectGroup>}
        {groups?.map((group, index) => (
          <div key={group.label}>
            {(hasLeading || hasFlat || index > 0) && <SelectSeparator />}
            <SelectGroup>
              <SelectLabel className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {group.label}
              </SelectLabel>
              {renderItems(group.options)}
            </SelectGroup>
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}
