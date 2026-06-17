-- iter-04: RPC for atomic browser data access + CHECK constraints

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_nickname_len;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_nickname_len
  CHECK (nickname IS NULL OR char_length(nickname) <= 32);

ALTER TABLE public.assistants
  DROP CONSTRAINT IF EXISTS assistants_name_len;

ALTER TABLE public.assistants
  ADD CONSTRAINT assistants_name_len
  CHECK (char_length(name) <= 64);

CREATE OR REPLACE FUNCTION public.create_conversation_with_opening(p_assistant_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_opening text;
  v_conv_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT opening_message INTO v_opening
  FROM public.assistants
  WHERE id = p_assistant_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assistant not found';
  END IF;

  INSERT INTO public.conversations (user_id, assistant_id)
  VALUES (v_user_id, p_assistant_id)
  RETURNING id INTO v_conv_id;

  IF v_opening IS NOT NULL AND btrim(v_opening) <> '' THEN
    INSERT INTO public.messages (conversation_id, role, content)
    VALUES (v_conv_id, 'assistant', btrim(v_opening));
  END IF;

  RETURN v_conv_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_assistants()
RETURNS SETOF public.assistants
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_template public.assistants%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF EXISTS (SELECT 1 FROM public.assistants WHERE user_id = v_user_id LIMIT 1) THEN
    RETURN QUERY
      SELECT *
      FROM public.assistants
      WHERE user_id = v_user_id
      ORDER BY updated_at DESC;
    RETURN;
  END IF;

  SELECT * INTO v_template
  FROM public.assistants
  WHERE user_id IS NULL AND is_default = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Platform assistant template not found';
  END IF;

  INSERT INTO public.assistants (
    user_id,
    name,
    icon,
    opening_message,
    system_prompt,
    model,
    is_default
  )
  VALUES (
    v_user_id,
    v_template.name,
    v_template.icon,
    v_template.opening_message,
    v_template.system_prompt,
    v_template.model,
    false
  );

  RETURN QUERY
    SELECT *
    FROM public.assistants
    WHERE user_id = v_user_id
    ORDER BY updated_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_assistant(p_assistant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_chat_count bigint;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT count(*) INTO v_chat_count
  FROM public.conversations
  WHERE assistant_id = p_assistant_id AND user_id = v_user_id;

  IF v_chat_count > 0 THEN
    RAISE EXCEPTION 'assistant_in_use:%', v_chat_count;
  END IF;

  DELETE FROM public.assistants
  WHERE id = p_assistant_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assistant not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_conversation_with_opening(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_assistants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_assistant(uuid) TO authenticated;
