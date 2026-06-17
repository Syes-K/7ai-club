-- Assistant icon (emoji text) + opening message (persisted on new chat)

ALTER TABLE public.assistants
  ADD COLUMN icon TEXT,
  ADD COLUMN opening_message TEXT;
