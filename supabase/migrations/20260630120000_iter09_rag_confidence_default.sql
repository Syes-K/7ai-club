-- iter-09: Lower default RAG confidence for BGE-M3 cosine similarity scale

ALTER TABLE public.user_profiles
  ALTER COLUMN rag_confidence_threshold SET DEFAULT 0.55;

UPDATE public.user_profiles
SET rag_confidence_threshold = 0.55
WHERE rag_confidence_threshold = 0.75;
