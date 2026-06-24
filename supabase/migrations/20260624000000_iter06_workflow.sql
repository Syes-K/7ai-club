-- iter-06: workflow runs and step logs for agent orchestration

CREATE TABLE public.workflow_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL CHECK (status IN ('running','completed','error','cancelled')),
  active_stream_id  TEXT,
  error_message     TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at       TIMESTAMPTZ
);

CREATE INDEX workflow_runs_conversation_started_idx
  ON public.workflow_runs (conversation_id, started_at DESC);

CREATE UNIQUE INDEX workflow_runs_one_active_per_conversation_idx
  ON public.workflow_runs (conversation_id)
  WHERE status = 'running';

CREATE TABLE public.workflow_step_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  node_id         TEXT NOT NULL,
  label           TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('running','success','error')),
  summary         TEXT,
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  duration_ms     INTEGER,
  UNIQUE (run_id, node_id)
);

CREATE INDEX workflow_step_logs_run_idx
  ON public.workflow_step_logs (run_id, started_at ASC);

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_runs_select_own"
  ON public.workflow_runs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "workflow_runs_insert_own"
  ON public.workflow_runs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workflow_runs_update_own"
  ON public.workflow_runs FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workflow_step_logs_select_own"
  ON public.workflow_step_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_runs wr
      WHERE wr.id = workflow_step_logs.run_id
        AND wr.user_id = auth.uid()
    )
  );

CREATE POLICY "workflow_step_logs_insert_own"
  ON public.workflow_step_logs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_runs wr
      WHERE wr.id = workflow_step_logs.run_id
        AND wr.user_id = auth.uid()
    )
  );

CREATE POLICY "workflow_step_logs_update_own"
  ON public.workflow_step_logs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_runs wr
      WHERE wr.id = workflow_step_logs.run_id
        AND wr.user_id = auth.uid()
    )
  );
