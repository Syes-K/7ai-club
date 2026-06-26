-- iter-07 follow-up: allow soft-archive updates + link workflow runs to user turns

CREATE POLICY "messages_update_own"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

ALTER TABLE public.workflow_runs
  ADD COLUMN user_message_id UUID
    REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE INDEX workflow_runs_user_message_idx
  ON public.workflow_runs (user_message_id)
  WHERE user_message_id IS NOT NULL;
