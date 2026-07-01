-- iter-09+: model capability type on user_model_configs (chat, embedding, …)

ALTER TABLE public.user_model_configs
  ADD COLUMN IF NOT EXISTS model_type TEXT NOT NULL DEFAULT 'chat'
    CHECK (model_type IN (
      'chat',
      'embedding',
      'image',
      'video',
      'audio',
      'moderation',
      'rerank'
    )),
  ADD COLUMN IF NOT EXISTS embedding_dimensions INT
    CHECK (
      embedding_dimensions IS NULL
      OR (embedding_dimensions >= 64 AND embedding_dimensions <= 8192)
    );

ALTER TABLE public.user_model_configs
  DROP CONSTRAINT IF EXISTS user_model_configs_unique_model;

ALTER TABLE public.user_model_configs
  ADD CONSTRAINT user_model_configs_unique_model
    UNIQUE (user_id, provider, model_name, model_type);

-- Existing rows remain chat; embedding configs set dimensions when created via app.
