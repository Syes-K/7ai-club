-- iter-05: user model configs + encrypted secrets + profile preference FK

CREATE TABLE public.user_model_configs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL
                CHECK (provider IN ('bailian', 'deepseek', 'siliconflow', 'openai')),
  model_name    TEXT NOT NULL CHECK (char_length(trim(model_name)) BETWEEN 1 AND 128),
  test_status   TEXT NOT NULL DEFAULT 'untested'
                CHECK (test_status IN ('untested', 'passed', 'failed')),
  tested_at     TIMESTAMPTZ,
  test_error    TEXT CHECK (test_error IS NULL OR char_length(test_error) <= 500),
  api_key_set   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_model_configs_unique_model
    UNIQUE (user_id, provider, model_name)
);

CREATE INDEX user_model_configs_user_id_idx
  ON public.user_model_configs (user_id);

CREATE TRIGGER user_model_configs_updated_at
  BEFORE UPDATE ON public.user_model_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_model_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_model_configs_select_own"
  ON public.user_model_configs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_model_configs_insert_own"
  ON public.user_model_configs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_model_configs_update_own"
  ON public.user_model_configs FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_model_configs_delete_own"
  ON public.user_model_configs FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.user_model_config_secrets (
  config_id           UUID PRIMARY KEY
                      REFERENCES public.user_model_configs(id) ON DELETE CASCADE,
  api_key_ciphertext  TEXT NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_model_config_secrets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_profiles
  ADD COLUMN preferred_model_config_id UUID
    REFERENCES public.user_model_configs(id) ON DELETE SET NULL;

ALTER TABLE public.user_profiles
  DROP COLUMN preferred_model;
