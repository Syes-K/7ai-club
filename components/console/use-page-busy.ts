"use client";

import { useCallback, useState } from "react";

export function usePageBusy() {
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | undefined>();

  const runBusy = useCallback(async <T,>(label: string, fn: () => Promise<T>): Promise<T> => {
    setBusy(true);
    setBusyLabel(label);
    try {
      return await fn();
    } finally {
      setBusy(false);
      setBusyLabel(undefined);
    }
  }, []);

  return { busy, busyLabel, runBusy };
}
