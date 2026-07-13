-- iter-12 follow-up: allow conversations with enabled platform assistants

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
  WHERE id = p_assistant_id
    AND (
      user_id = v_user_id
      OR (is_platform = true AND enabled = true)
    );

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
