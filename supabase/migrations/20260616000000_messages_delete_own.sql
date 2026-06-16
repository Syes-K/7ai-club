-- Allow users to delete messages in their own conversations (clear chat history)
CREATE POLICY "messages_delete_own"
  ON public.messages FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );
