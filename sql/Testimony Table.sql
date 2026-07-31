-- Testimony table, 2026-07-31.
-- Run in the Supabase SQL editor.
--
-- One row per user (like user_preferences) — a single evolving write-up of
-- their testimony, not a list. `content` is encrypted client-side with the
-- same AES-GCM scheme journal entries use (see src/utils/encryption.js).

CREATE TABLE public.testimonies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own testimony"
  ON public.testimonies
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
