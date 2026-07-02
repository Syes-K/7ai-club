-- iter-09 patch: optional RAG query optimization (default off)

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS rag_query_optimize_enabled BOOLEAN NOT NULL DEFAULT false;
