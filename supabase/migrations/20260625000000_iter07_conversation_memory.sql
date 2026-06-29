-- iter-07: conversation memory summarization

ALTER TABLE public.user_profiles
  ADD COLUMN summarization_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN summary_trigger_turns INT NOT NULL DEFAULT 20,
  ADD COLUMN summary_retain_turns INT NOT NULL DEFAULT 4,
  ADD COLUMN summary_trigger_tokens INT NOT NULL DEFAULT 8000,
  ADD COLUMN summary_retain_tokens INT NOT NULL DEFAULT 2000,
  ADD COLUMN summary_model_config_id UUID
    REFERENCES public.user_model_configs(id) ON DELETE SET NULL;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_summary_trigger_turns_check
    CHECK (summary_trigger_turns >= 1),
  ADD CONSTRAINT user_profiles_summary_retain_turns_nonneg_check
    CHECK (summary_retain_turns >= 0),
  ADD CONSTRAINT user_profiles_summary_trigger_tokens_check
    CHECK (summary_trigger_tokens >= 1),
  ADD CONSTRAINT user_profiles_summary_retain_tokens_check
    CHECK (summary_retain_tokens >= 1),
  ADD CONSTRAINT user_profiles_summary_retain_turns_le_trigger_check
    CHECK (summary_retain_turns <= summary_trigger_turns),
  ADD CONSTRAINT user_profiles_summary_retain_tokens_le_trigger_check
    CHECK (summary_retain_tokens <= summary_trigger_tokens);

ALTER TABLE public.messages
  ADD COLUMN summarized_at TIMESTAMPTZ NULL;

CREATE INDEX messages_conversation_active_idx
  ON public.messages (conversation_id, created_at ASC)
  WHERE summarized_at IS NULL;

CREATE TABLE public.conversation_memory_summaries (
  conversation_id UUID PRIMARY KEY
    REFERENCES public.conversations(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  token_estimate  INT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER conversation_memory_summaries_updated_at
  BEFORE UPDATE ON public.conversation_memory_summaries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.conversation_memory_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation_memory_summaries_owner"
  ON public.conversation_memory_summaries
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_memory_summaries.conversation_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_memory_summaries.conversation_id
        AND c.user_id = auth.uid()
    )
  );
