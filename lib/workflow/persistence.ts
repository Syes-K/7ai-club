import type { SupabaseClient } from "@supabase/supabase-js";
import { matchBestRunPerUserMessage } from "@/lib/workflow/match-runs-to-messages";
import type {
  WorkflowRunStatus,
  WorkflowRunSummary,
  WorkflowStepEvent,
  WorkflowStepStatus,
} from "@/lib/workflow/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toUuidOrNull(value: string | undefined): string | null {
  if (!value || !UUID_RE.test(value)) {
    return null;
  }

  return value;
}

type WorkflowRunRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  status: WorkflowRunStatus;
  active_stream_id: string | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

type WorkflowStepLogRow = {
  run_id: string;
  node_id: string;
  label: string;
  status: WorkflowStepStatus;
  summary: string | null;
  detail: string | null;
  detail_format: string | null;
  kind: string | null;
  sort_order: number | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

function stepLogToEvent(row: WorkflowStepLogRow): WorkflowStepEvent {
  return {
    runId: row.run_id,
    nodeId: row.node_id,
    label: row.label,
    status: row.status,
    summary: row.summary ?? undefined,
    detail: row.detail ?? undefined,
    detailFormat:
      row.detail_format === "plain" || row.detail_format === "markdown"
        ? row.detail_format
        : undefined,
    kind:
      row.kind === "default" ||
      row.kind === "reasoning" ||
      row.kind === "stream"
        ? row.kind
        : undefined,
    order: row.sort_order ?? undefined,
    error: row.error_message ?? undefined,
    startedAt: row.started_at,
    finishedAt: row.finished_at ?? undefined,
  };
}

export async function createWorkflowRun(
  supabase: SupabaseClient,
  params: {
    conversationId: string;
    userId: string;
    userMessageId?: string;
  },
): Promise<string> {
  const { data, error } = await supabase
    .from("workflow_runs")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      user_message_id: toUuidOrNull(params.userMessageId),
      status: "running",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create workflow run");
  }

  return data.id as string;
}

export async function finishWorkflowRun(
  supabase: SupabaseClient,
  runId: string,
  status: Exclude<WorkflowRunStatus, "running">,
  errorMessage?: string,
): Promise<void> {
  const { error } = await supabase
    .from("workflow_runs")
    .update({
      status,
      error_message: errorMessage ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function setActiveStreamId(
  supabase: SupabaseClient,
  runId: string,
  streamId: string,
): Promise<void> {
  const { error } = await supabase
    .from("workflow_runs")
    .update({ active_stream_id: streamId })
    .eq("id", runId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearActiveStreamId(
  supabase: SupabaseClient,
  runId: string,
): Promise<void> {
  const { error } = await supabase
    .from("workflow_runs")
    .update({ active_stream_id: null })
    .eq("id", runId);

  if (error) {
    throw new Error(error.message);
  }
}

function isMissingExtendedStepLogSchema(error: { message?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("schema cache") ||
    message.includes("could not find") ||
    message.includes("detail_format") ||
    message.includes("sort_order")
  );
}

function legacyStatusForUpsert(
  status: WorkflowStepStatus,
): WorkflowStepStatus {
  return status === "skipped" ? "success" : status;
}

function legacySummaryForUpsert(event: WorkflowStepEvent): string | null {
  if (event.status === "skipped") {
    return event.summary ?? "Skipped";
  }

  if (event.detail?.trim()) {
    const headline = event.summary?.trim() ?? event.label;
    return `${headline}\n\n${event.detail}`;
  }

  return event.summary ?? null;
}

type LegacyWorkflowStepLogRow = {
  run_id: string;
  node_id: string;
  label: string;
  status: WorkflowStepStatus;
  summary: string | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

function legacyStepLogToEvent(row: LegacyWorkflowStepLogRow): WorkflowStepEvent {
  return stepLogToEvent({
    ...row,
    detail: null,
    detail_format: null,
    kind: null,
    sort_order: null,
  });
}

export async function upsertWorkflowStepLog(
  supabase: SupabaseClient,
  event: WorkflowStepEvent,
): Promise<void> {
  const startedAt = event.startedAt ?? new Date().toISOString();
  const finishedAt = event.finishedAt ?? null;
  const durationMs =
    finishedAt != null
      ? Math.max(
          0,
          new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
        )
      : null;

  const extendedRow = {
    run_id: event.runId,
    node_id: event.nodeId,
    label: event.label,
    status: event.status,
    summary: event.summary ?? null,
    detail: event.detail ?? null,
    detail_format: event.detailFormat ?? "markdown",
    kind: event.kind ?? "default",
    sort_order: event.order ?? null,
    error_message: event.error ?? null,
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: durationMs,
  };

  const { error } = await supabase
    .from("workflow_step_logs")
    .upsert(extendedRow, { onConflict: "run_id,node_id" });

  if (!error) {
    return;
  }

  if (!isMissingExtendedStepLogSchema(error)) {
    throw new Error(error.message);
  }

  const { error: legacyError } = await supabase.from("workflow_step_logs").upsert(
    {
      run_id: event.runId,
      node_id: event.nodeId,
      label: event.label,
      status: legacyStatusForUpsert(event.status),
      summary: legacySummaryForUpsert(event),
      error_message: event.error ?? null,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: durationMs,
    },
    { onConflict: "run_id,node_id" },
  );

  if (legacyError) {
    throw new Error(legacyError.message);
  }
}

export async function getActiveRunForConversation(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
): Promise<WorkflowRunSummary | null> {
  const { data, error } = await supabase
    .from("workflow_runs")
    .select("id, status, started_at, active_stream_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as WorkflowRunRow;
  return {
    id: row.id,
    status: row.status,
    startedAt: row.started_at,
    activeStreamId: row.active_stream_id,
  };
}

export async function getLatestRunForConversation(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
): Promise<WorkflowRunSummary | null> {
  const active = await getActiveRunForConversation(
    supabase,
    conversationId,
    userId,
  );
  if (active) {
    return active;
  }

  const { data, error } = await supabase
    .from("workflow_runs")
    .select("id, status, started_at, active_stream_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as WorkflowRunRow;
  return {
    id: row.id,
    status: row.status,
    startedAt: row.started_at,
    activeStreamId: row.active_stream_id,
  };
}

export async function getStepLogsForRun(
  supabase: SupabaseClient,
  runId: string,
): Promise<WorkflowStepEvent[]> {
  const extended = await supabase
    .from("workflow_step_logs")
    .select(
      "run_id, node_id, label, status, summary, detail, detail_format, kind, sort_order, error_message, started_at, finished_at",
    )
    .eq("run_id", runId)
    .order("started_at", { ascending: true });

  if (!extended.error) {
    return (extended.data as WorkflowStepLogRow[]).map(stepLogToEvent);
  }

  if (!isMissingExtendedStepLogSchema(extended.error)) {
    throw new Error(extended.error.message);
  }

  const legacy = await supabase
    .from("workflow_step_logs")
    .select(
      "run_id, node_id, label, status, summary, error_message, started_at, finished_at",
    )
    .eq("run_id", runId)
    .order("started_at", { ascending: true });

  if (legacy.error) {
    throw new Error(legacy.error.message);
  }

  return (legacy.data as LegacyWorkflowStepLogRow[]).map(legacyStepLogToEvent);
}

export async function cancelStaleRuns(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
): Promise<Array<{ runId: string; streamId: string | null }>> {
  const { data, error } = await supabase
    .from("workflow_runs")
    .select("id, active_stream_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .eq("status", "running");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    id: string;
    active_stream_id: string | null;
  }>;

  if (rows.length === 0) {
    return [];
  }

  const { error: updateError } = await supabase
    .from("workflow_runs")
    .update({
      status: "cancelled",
      finished_at: new Date().toISOString(),
      active_stream_id: null,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .eq("status", "running");

  if (updateError) {
    throw new Error(updateError.message);
  }

  return rows.map((row) => ({
    runId: row.id,
    streamId: row.active_stream_id,
  }));
}

type WorkflowRunWithUserMessageRow = WorkflowRunRow & {
  user_message_id: string | null;
};

export type WorkflowRunRestoreEntry = {
  run: {
    id: string;
    status: WorkflowRunStatus;
    startedAt: string;
  };
  userMessageId: string | null;
  steps: WorkflowStepEvent[];
};

export function resolveRunUserMessageIds(
  runs: Array<{ user_message_id: string | null }>,
  orderedUserMessageIds: string[],
): Array<string | null> {
  let messageIndex = 0;

  return runs.map((run) => {
    if (run.user_message_id) {
      const matchedIndex = orderedUserMessageIds.indexOf(run.user_message_id);
      if (matchedIndex >= 0) {
        messageIndex = matchedIndex + 1;
      }
      return run.user_message_id;
    }

    const inferred = orderedUserMessageIds[messageIndex] ?? null;
    messageIndex += 1;
    return inferred;
  });
}

async function listUserMessagesForConversation(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<Array<{ id: string; createdAt: string }>> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, created_at")
    .eq("conversation_id", conversationId)
    .eq("role", "user")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
  }));
}

export async function getWorkflowRunsForConversation(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
): Promise<WorkflowRunRestoreEntry[]> {
  const { data, error } = await supabase
    .from("workflow_runs")
    .select("id, status, started_at, user_message_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("started_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as WorkflowRunWithUserMessageRow[];
  if (rows.length === 0) {
    return [];
  }

  const userMessages = await listUserMessagesForConversation(
    supabase,
    conversationId,
  );

  const { data: stepCountsData, error: stepCountsError } = await supabase
    .from("workflow_step_logs")
    .select("run_id")
    .in(
      "run_id",
      rows.map((row) => row.id),
    );

  if (stepCountsError) {
    throw new Error(stepCountsError.message);
  }

  const stepCountByRunId = new Map<string, number>();
  for (const row of stepCountsData ?? []) {
    const runId = row.run_id as string;
    stepCountByRunId.set(runId, (stepCountByRunId.get(runId) ?? 0) + 1);
  }

  const matches = matchBestRunPerUserMessage(
    rows.map((row) => ({
      id: row.id,
      startedAt: row.started_at,
      status: row.status,
      userMessageId: row.user_message_id,
      stepCount: stepCountByRunId.get(row.id) ?? 0,
    })),
    userMessages,
  );

  return Promise.all(
    [...matches.entries()].map(async ([userMessageId, runRef]) => {
      const matchedRow = rows.find((row) => row.id === runRef.id)!;

      return {
        run: {
          id: matchedRow.id,
          status: matchedRow.status,
          startedAt: matchedRow.started_at,
        },
        userMessageId,
        steps: await getStepLogsForRun(supabase, runRef.id),
      };
    }),
  );
}
