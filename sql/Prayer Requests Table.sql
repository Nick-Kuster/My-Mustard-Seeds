-- Prayer requests table, 2026-07-31.
-- Run in the Supabase SQL editor.
--
-- One row per prayer request. `content` and `answer_note` are encrypted
-- client-side with the same AES-GCM scheme journal entries and quotes use
-- (see src/utils/encryption.js) before being stored — this is personal
-- content and should be protected the same way.

CREATE TABLE public.prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'answered')),
  answer_note text,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX prayer_requests_user_id_idx ON public.prayer_requests(user_id);

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own prayer requests"
  ON public.prayer_requests
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
