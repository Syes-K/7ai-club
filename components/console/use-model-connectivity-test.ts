"use client";

import { useCallback, useState } from "react";
import type { ModelConfigDto } from "@/lib/data/types";
import type { ModelTestFailure } from "@/components/console/model-test-failure-dialog";
import { formatModelConfigTestLabel } from "@/components/console/model-test-status";

type RunBusy = <T>(label: string, fn: () => Promise<T>) => Promise<T>;

export function useModelConnectivityTest({
  busy,
  runBusy,
  refreshList,
}: {
  busy: boolean;
  runBusy: RunBusy;
  refreshList: () => Promise<void>;
}) {
  const [testFailure, setTestFailure] = useState<ModelTestFailure | null>(null);
  const [testFailureOpen, setTestFailureOpen] = useState(false);

  const closeTestFailure = useCallback(() => {
    setTestFailureOpen(false);
    setTestFailure(null);
  }, []);

  const showTestFailure = useCallback((modelLabel: string, message: string) => {
    setTestFailure({ modelLabel, message });
    setTestFailureOpen(true);
  }, []);

  const handleTest = useCallback(
    async (
      config: ModelConfigDto,
      testFn: (id: string) => Promise<ModelConfigDto>,
    ) => {
      if (busy) return;

      const modelLabel = formatModelConfigTestLabel(config);

      try {
        await runBusy("Testing model…", async () => {
          const result = await testFn(config.id);
          await refreshList();
          if (result.testStatus === "failed") {
            showTestFailure(
              modelLabel,
              result.testError ?? "Connectivity test failed.",
            );
          }
        });
      } catch (err) {
        showTestFailure(
          modelLabel,
          err instanceof Error ? err.message : "Test failed",
        );
        try {
          await refreshList();
        } catch {
          // keep prior list
        }
      }
    },
    [busy, refreshList, runBusy, showTestFailure],
  );

  return {
    testFailure,
    testFailureOpen,
    closeTestFailure,
    handleTest,
  };
}
