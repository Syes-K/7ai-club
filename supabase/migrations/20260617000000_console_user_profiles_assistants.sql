-- Console: user_profiles + per-user assistants

CREATE TABLE public.user_profiles (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname         TEXT,
  preferred_model  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Per-user assistants (NULL user_id = platform template, read-only for users)
ALTER TABLE public.assistants
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS assistants_single_default_idx;

CREATE INDEX assistants_user_id_idx ON public.assistants (user_id);

CREATE TRIGGER assistants_updated_at
  BEFORE UPDATE ON public.assistants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "assistants_select_authenticated" ON public.assistants;

CREATE POLICY "assistants_select_own_or_legacy"
  ON public.assistants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "assistants_insert_own"
  ON public.assistants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "assistants_update_own"
  ON public.assistants FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "assistants_delete_own"
  ON public.assistants FOR DELETE TO authenticated
  USING (user_id = auth.uid());
