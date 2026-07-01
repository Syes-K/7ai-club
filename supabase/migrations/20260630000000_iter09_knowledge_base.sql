-- iter-09: Knowledge base RAG (pgvector, KB tables, assistant bindings, profile RAG prefs)

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- knowledge_bases
-- ---------------------------------------------------------------------------

CREATE TABLE public.knowledge_bases (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 64),
  description           TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  source_type           TEXT NOT NULL CHECK (source_type IN ('text', 'file')),
  source_text           TEXT,
  source_filename       TEXT,
  source_mime           TEXT,
  storage_path          TEXT,
  parsed_markdown       TEXT,
  status                TEXT NOT NULL DEFAULT 'processing'
                        CHECK (status IN ('processing', 'ready', 'error')),
  error_message         TEXT CHECK (error_message IS NULL OR char_length(error_message) <= 500),
  embedding_provider    TEXT NOT NULL,
  embedding_model       TEXT NOT NULL,
  embedding_dimensions  INT NOT NULL DEFAULT 1024,
  chunk_size_tokens     INT NOT NULL,
  chunk_overlap_tokens  INT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kb_source_check CHECK (
    (source_type = 'text' AND source_text IS NOT NULL AND storage_path IS NULL)
    OR (source_type = 'file' AND storage_path IS NOT NULL AND source_filename IS NOT NULL)
  )
);

CREATE INDEX knowledge_bases_user_id_idx ON public.knowledge_bases (user_id);
CREATE INDEX knowledge_bases_user_status_idx ON public.knowledge_bases (user_id, status);

CREATE TRIGGER knowledge_bases_updated_at
  BEFORE UPDATE ON public.knowledge_bases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_bases_select_own"
  ON public.knowledge_bases FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "knowledge_bases_insert_own"
  ON public.knowledge_bases FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "knowledge_bases_update_own"
  ON public.knowledge_bases FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "knowledge_bases_delete_own"
  ON public.knowledge_bases FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- knowledge_base_chunks (service_role writes; owner reads via join)
-- ---------------------------------------------------------------------------

CREATE TABLE public.knowledge_base_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id           UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  chunk_index     INT NOT NULL,
  content         TEXT NOT NULL,
  heading_path    TEXT,
  char_start      INT NOT NULL,
  char_end        INT NOT NULL,
  embedding       extensions.vector(1024) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kb_chunks_unique_index UNIQUE (kb_id, chunk_index)
);

CREATE INDEX knowledge_base_chunks_kb_id_idx ON public.knowledge_base_chunks (kb_id);

CREATE INDEX knowledge_base_chunks_embedding_idx
  ON public.knowledge_base_chunks
  USING hnsw (embedding extensions.vector_cosine_ops);

ALTER TABLE public.knowledge_base_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_chunks_select_own"
  ON public.knowledge_base_chunks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      WHERE kb.id = kb_id AND kb.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- assistant_knowledge_bases
-- ---------------------------------------------------------------------------

CREATE TABLE public.assistant_knowledge_bases (
  assistant_id  UUID NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
  kb_id         UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (assistant_id, kb_id)
);

CREATE INDEX assistant_knowledge_bases_kb_id_idx
  ON public.assistant_knowledge_bases (kb_id);

ALTER TABLE public.assistant_knowledge_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_kb_select_own"
  ON public.assistant_knowledge_bases FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assistants a
      WHERE a.id = assistant_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "assistant_kb_insert_own"
  ON public.assistant_knowledge_bases FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assistants a
      WHERE a.id = assistant_id AND a.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      WHERE kb.id = kb_id AND kb.user_id = auth.uid() AND kb.status = 'ready'
    )
  );

CREATE POLICY "assistant_kb_delete_own"
  ON public.assistant_knowledge_bases FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assistants a
      WHERE a.id = assistant_id AND a.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- user_profiles RAG preferences
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS rag_confidence_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.75
    CHECK (rag_confidence_threshold > 0 AND rag_confidence_threshold <= 1),
  ADD COLUMN IF NOT EXISTS rag_top_k INT NOT NULL DEFAULT 5
    CHECK (rag_top_k >= 1 AND rag_top_k <= 50),
  ADD COLUMN IF NOT EXISTS rag_embedding_provider TEXT NOT NULL DEFAULT 'siliconflow',
  ADD COLUMN IF NOT EXISTS rag_embedding_model TEXT NOT NULL DEFAULT 'BAAI/bge-m3';

-- ---------------------------------------------------------------------------
-- RPC: match_knowledge_base_chunks
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.match_knowledge_base_chunks(
  p_kb_ids uuid[],
  p_query_embedding extensions.vector(1024),
  p_match_count int,
  p_min_score float
)
RETURNS TABLE (
  kb_id uuid,
  chunk_id uuid,
  content text,
  heading_path text,
  char_start int,
  char_end int,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT
    c.kb_id,
    c.id AS chunk_id,
    c.content,
    c.heading_path,
    c.char_start,
    c.char_end,
    (1 - (c.embedding <=> p_query_embedding))::float AS similarity
  FROM public.knowledge_base_chunks c
  JOIN public.knowledge_bases kb ON kb.id = c.kb_id
  WHERE c.kb_id = ANY(p_kb_ids)
    AND kb.user_id = auth.uid()
    AND kb.status = 'ready'
    AND (1 - (c.embedding <=> p_query_embedding)) >= p_min_score
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT GREATEST(p_match_count, 0);
$$;

GRANT EXECUTE ON FUNCTION public.match_knowledge_base_chunks(uuid[], extensions.vector(1024), int, float)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: delete_knowledge_base
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.delete_knowledge_base(p_kb_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_binding_count bigint;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT count(*) INTO v_binding_count
  FROM public.assistant_knowledge_bases
  WHERE kb_id = p_kb_id;

  IF v_binding_count > 0 THEN
    RAISE EXCEPTION 'kb_in_use:%', v_binding_count;
  END IF;

  DELETE FROM public.knowledge_bases
  WHERE id = p_kb_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Knowledge base not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_knowledge_base(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: set_assistant_knowledge_bases
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_assistant_knowledge_bases(
  p_assistant_id uuid,
  p_kb_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_kb_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.assistants
    WHERE id = p_assistant_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Assistant not found';
  END IF;

  IF p_kb_ids IS NOT NULL THEN
    FOREACH v_kb_id IN ARRAY p_kb_ids
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.knowledge_bases
        WHERE id = v_kb_id AND user_id = v_user_id AND status = 'ready'
      ) THEN
        RAISE EXCEPTION 'Invalid or not-ready knowledge base: %', v_kb_id;
      END IF;
    END LOOP;
  END IF;

  DELETE FROM public.assistant_knowledge_bases
  WHERE assistant_id = p_assistant_id;

  IF p_kb_ids IS NOT NULL THEN
    INSERT INTO public.assistant_knowledge_bases (assistant_id, kb_id)
    SELECT p_assistant_id, unnest(p_kb_ids);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_assistant_knowledge_bases(uuid, uuid[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket (private)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-base-files',
  'knowledge-base-files',
  false,
  10485760,
  ARRAY[
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "kb_storage_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'knowledge-base-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "kb_storage_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'knowledge-base-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "kb_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'knowledge-base-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
