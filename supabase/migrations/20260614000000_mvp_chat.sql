-- MVP Chat: assistants, conversations, messages + RLS

CREATE TABLE public.assistants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  model         TEXT NOT NULL DEFAULT 'Qwen/Qwen2.5-7B-Instruct',
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX assistants_single_default_idx
  ON public.assistants (is_default) WHERE is_default = true;

CREATE TABLE public.conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_id  UUID NOT NULL REFERENCES public.assistants(id) ON DELETE RESTRICT,
  title         TEXT NOT NULL DEFAULT 'New Chat',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX conversations_user_updated_idx
  ON public.conversations (user_id, updated_at DESC);

CREATE INDEX messages_conversation_created_idx
  ON public.messages (conversation_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_updated_at();

INSERT INTO public.assistants (name, system_prompt, model, is_default)
VALUES (
  '7ai Assistant',
  'You are the AI assistant for 7ai-club. Answer clearly and concisely. Match the language the user writes in.',
  'Qwen/Qwen2.5-7B-Instruct',
  true
);

ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistants_select_authenticated"
  ON public.assistants FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "conversations_select_own"
  ON public.conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "conversations_insert_own"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "conversations_update_own"
  ON public.conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "conversations_delete_own"
  ON public.conversations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );
