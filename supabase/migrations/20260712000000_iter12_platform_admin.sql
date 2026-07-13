-- iter-12: platform admin — platform models, platform assistants, RPC no-op

-- Platform free model configs
CREATE TABLE public.platform_model_configs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name         TEXT CHECK (display_name IS NULL OR char_length(display_name) <= 128),
  provider             TEXT NOT NULL
    CHECK (provider IN ('bailian', 'deepseek', 'siliconflow', 'openai')),
  model_name           TEXT NOT NULL CHECK (char_length(trim(model_name)) BETWEEN 1 AND 128),
  model_type           TEXT NOT NULL DEFAULT 'chat'
    CHECK (model_type IN ('chat', 'embedding', 'image', 'video', 'audio', 'moderation', 'rerank')),
  embedding_dimensions INT CHECK (embedding_dimensions IS NULL OR embedding_dimensions > 0),
  enabled              BOOLEAN NOT NULL DEFAULT true,
  sort_order           INT NOT NULL DEFAULT 0,
  test_status          TEXT NOT NULL DEFAULT 'untested'
    CHECK (test_status IN ('untested', 'passed', 'failed')),
  tested_at            TIMESTAMPTZ,
  test_error           TEXT CHECK (test_error IS NULL OR char_length(test_error) <= 500),
  api_key_set          BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT platform_model_configs_unique
    UNIQUE (provider, model_name, model_type)
);

CREATE INDEX platform_model_configs_sort_idx
  ON public.platform_model_configs (sort_order, created_at);

CREATE TABLE public.platform_model_config_secrets (
  config_id           UUID PRIMARY KEY
    REFERENCES public.platform_model_configs(id) ON DELETE CASCADE,
  api_key_ciphertext  TEXT NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_model_config_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_model_configs_select_enabled"
  ON public.platform_model_configs FOR SELECT TO authenticated
  USING (enabled = true);

-- Platform assistants
ALTER TABLE public.assistants
  ADD COLUMN IF NOT EXISTS is_platform BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;

UPDATE public.assistants
SET is_platform = true, enabled = true, user_id = NULL
WHERE user_id IS NULL;

UPDATE public.assistants
SET is_platform = false
WHERE user_id IS NOT NULL;

DROP POLICY IF EXISTS "assistants_select_authenticated" ON public.assistants;
DROP POLICY IF EXISTS "assistants_select_own_or_legacy" ON public.assistants;

CREATE POLICY "assistants_select_personal_or_platform"
  ON public.assistants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (is_platform = true AND enabled = true)
  );

-- Relax preferred_model_config_id FK (may reference platform or user config)
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_preferred_model_config_id_fkey;

-- Seed default platform model row (key via Admin UI)
INSERT INTO public.platform_model_configs (
  display_name, provider, model_name, model_type, enabled, sort_order, test_status
) VALUES (
  'Bailian qwen3.7-max', 'bailian', 'qwen3.7-max-2026-06-08', 'chat', true, 0, 'untested'
)
ON CONFLICT (provider, model_name, model_type) DO NOTHING;

UPDATE public.user_profiles up
SET preferred_model_config_id = (
  SELECT id FROM public.platform_model_configs
  WHERE enabled AND test_status = 'passed' AND model_type = 'chat'
  ORDER BY sort_order ASC, created_at ASC
  LIMIT 1
)
WHERE preferred_model_config_id IS NULL
   OR preferred_model_config_id = '00000000-0000-0000-0000-000000000001';

-- ensure_user_assistants: no-op (SELECT only, no template copy)
CREATE OR REPLACE FUNCTION public.ensure_user_assistants()
RETURNS SETOF public.assistants
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.assistants
  WHERE user_id = auth.uid()
  ORDER BY updated_at DESC;
$$;
