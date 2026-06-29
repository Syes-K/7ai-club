-- iter-07 follow-up: align summary retain defaults with PRD (4 turns / 2000 tokens)

ALTER TABLE public.user_profiles
  ALTER COLUMN summary_retain_turns SET DEFAULT 4,
  ALTER COLUMN summary_retain_tokens SET DEFAULT 2000;

UPDATE public.user_profiles
SET
  summary_retain_turns = 4,
  summary_retain_tokens = 2000
WHERE summary_retain_turns = 6
  AND summary_retain_tokens = 4000;
