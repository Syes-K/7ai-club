-- iter-08: workflow step UI protocol extensions

ALTER TABLE public.workflow_step_logs
  ADD COLUMN IF NOT EXISTS detail TEXT,
  ADD COLUMN IF NOT EXISTS detail_format TEXT NOT NULL DEFAULT 'markdown'
    CHECK (detail_format IN ('plain', 'markdown')),
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'default'
    CHECK (kind IN ('default', 'reasoning', 'stream')),
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

ALTER TABLE public.workflow_step_logs
  DROP CONSTRAINT IF EXISTS workflow_step_logs_status_check;

ALTER TABLE public.workflow_step_logs
  ADD CONSTRAINT workflow_step_logs_status_check
  CHECK (status IN ('running', 'success', 'error', 'skipped'));

CREATE INDEX IF NOT EXISTS workflow_step_logs_run_order_idx
  ON public.workflow_step_logs (run_id, sort_order ASC NULLS LAST, started_at ASC);
