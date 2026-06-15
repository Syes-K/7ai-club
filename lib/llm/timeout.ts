/** Merge multiple AbortSignals; aborts when any source aborts. */
export function mergeAbortSignals(
  ...signals: (AbortSignal | undefined)[]
): AbortSignal | undefined {
  const active = signals.filter((s): s is AbortSignal => s != null);
  if (active.length === 0) return undefined;
  if (active.length === 1) return active[0];

  const controller = new AbortController();
  for (const signal of active) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}

export function getLlmTimeoutMs(): number {
  const raw = process.env.LLM_TIMEOUT_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  // Stay under Vercel Pro default (60s); Hobby caps at 10s regardless.
  return 55_000;
}

/** fetch wrapper that aborts hung upstream LLM requests. */
export function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = mergeAbortSignals(init?.signal ?? undefined, timeoutSignal);
    return fetch(input, { ...init, signal });
  };
}
