import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WorkflowRunStatus,
  WorkflowRunSummary,
  WorkflowStepEvent,
  WorkflowStepStatus,
} from "@/lib/workflow/types";

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
  },
): Promise<string> {
  const { data, error } = await supabase
    .from("workflow_runs")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
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

  const { error } = await supabase.from("workflow_step_logs").upsert(
    {
      run_id: event.runId,
      node_id: event.nodeId,
      label: event.label,
      status: event.status,
      summary: event.summary ?? null,
      error_message: event.error ?? null,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: durationMs,
    },
    { onConflict: "run_id,node_id" },
  );

  if (error) {
    throw new Error(error.message);
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
  const { data, error } = await supabase
    .from("workflow_step_logs")
    .select(
      "run_id, node_id, label, status, summary, error_message, started_at, finished_at",
    )
    .eq("run_id", runId)
    .order("started_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as WorkflowStepLogRow[]).map(stepLogToEvent);
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
