import type { WorkflowRunStatus } from "@/lib/workflow/types";

export type UserMessageRef = {
  id: string;
  createdAt: string;
};

export type WorkflowRunRef = {
  id: string;
  startedAt: string;
  status: WorkflowRunStatus;
  userMessageId: string | null;
  stepCount: number;
};

function runRestoreScore(run: WorkflowRunRef): number {
  let score = run.stepCount;

  if (run.status === "completed") {
    score += 1_000;
  } else if (run.status === "error") {
    score += 800;
  } else if (run.status === "running") {
    score += 600;
  }

  return score;
}

function isRunInUserMessageWindow(
  run: WorkflowRunRef,
  userMessage: UserMessageRef,
  nextUserMessage: UserMessageRef | null,
): boolean {
  if (run.startedAt < userMessage.createdAt) {
    return false;
  }

  if (nextUserMessage && run.startedAt >= nextUserMessage.createdAt) {
    return false;
  }

  return true;
}

function pickBestRun(candidates: WorkflowRunRef[]): WorkflowRunRef | null {
  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((best, run) => {
    const bestScore = runRestoreScore(best);
    const runScore = runRestoreScore(run);

    if (runScore > bestScore) {
      return run;
    }

    if (runScore === bestScore && run.startedAt > best.startedAt) {
      return run;
    }

    return best;
  });
}

export function matchBestRunPerUserMessage(
  runs: WorkflowRunRef[],
  userMessages: UserMessageRef[],
): Map<string, WorkflowRunRef> {
  const eligibleRuns = runs.filter((run) => run.status !== "cancelled");
  const matches = new Map<string, WorkflowRunRef>();

  for (let index = 0; index < userMessages.length; index += 1) {
    const userMessage = userMessages[index]!;
    const nextUserMessage = userMessages[index + 1] ?? null;

    const explicitMatches = eligibleRuns.filter(
      (run) => run.userMessageId === userMessage.id,
    );
    const windowMatches = eligibleRuns.filter((run) =>
      isRunInUserMessageWindow(run, userMessage, nextUserMessage),
    );

    const bestRun = pickBestRun(
      explicitMatches.length > 0 ? explicitMatches : windowMatches,
    );

    if (bestRun) {
      matches.set(userMessage.id, bestRun);
    }
  }

  return matches;
}
