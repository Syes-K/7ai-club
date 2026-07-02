/** Opaque sticky Actions column — avoids long text in the previous column showing through on hover. */
const STICKY_ACTIONS_CELL =
  "sticky right-0 z-20 border-l border-[var(--neon-primary)]/15 bg-[var(--bg-base)] px-2 py-3 align-middle shadow-[-8px_0_16px_-10px_rgba(0,0,0,0.55)] group-hover:bg-[var(--bg-elevated)]";

const STICKY_ACTIONS_HEAD =
  "sticky right-0 z-10 border-l border-[var(--neon-primary)]/15 bg-[var(--bg-elevated)] px-2 py-3 shadow-[-8px_0_16px_-10px_rgba(0,0,0,0.4)]";

export const CONSOLE_TABLE_ACTIONS_CELL_13 = `${STICKY_ACTIONS_CELL} w-[13rem] min-w-[13rem] max-w-[13rem]`;

export const CONSOLE_TABLE_ACTIONS_CELL_9_5 = `${STICKY_ACTIONS_CELL} w-[9.5rem] min-w-[9.5rem] max-w-[9.5rem]`;

export const CONSOLE_TABLE_ACTIONS_HEAD_13 = `${STICKY_ACTIONS_HEAD} w-[13rem] min-w-[13rem] max-w-[13rem]`;

export const CONSOLE_TABLE_ACTIONS_HEAD_9_5 = `${STICKY_ACTIONS_HEAD} w-[9.5rem] min-w-[9.5rem] max-w-[9.5rem]`;

export const CONSOLE_TABLE_ACTION_BUTTON_CLASS = "h-7 shrink-0 px-1.5 text-xs";

/** Truncate the column immediately left of sticky Actions. */
export const CONSOLE_TABLE_PRE_ACTIONS_CELL =
  "max-w-[9rem] truncate whitespace-nowrap px-4 py-3 text-[var(--text-muted)]";

export const CONSOLE_TABLE_ACTIONS_WRAP_13 = "flex max-w-[13rem] flex-wrap items-center gap-x-1 gap-y-0.5";

export const CONSOLE_TABLE_ACTIONS_WRAP_9_5 =
  "flex max-w-[9.5rem] flex-wrap items-center gap-x-1 gap-y-0.5";
