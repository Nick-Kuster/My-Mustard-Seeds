-- User preferences table, 2026-07-31.
-- Run in the Supabase SQL editor.
--
-- Stores per-user app preferences as a single flat jsonb blob rather than
-- one column per setting or an EAV-style key/value table with a row per
-- setting. Preferences here are simple, low-cardinality, app-only values
-- that are never filtered/joined on in SQL — a jsonb blob means adding a
-- new setting later is a client-side change only, no migration, while
-- still being a single row read/write per user. Revisit only if a specific
-- setting ever needs to be queried, indexed, or constrained on its own.
--
-- First setting: "journalOrder" — an array of journal type ids (see
-- src/constants/journalTypes.js) giving the user's preferred order for the
-- homepage's type lanes. Types missing from the stored array (e.g. new
-- types added after the user last customized it) fall back to the
-- canonical JOURNAL_TYPES order, appended at the end — handled client-side
-- in src/stores/userPreferences.js, not enforced here.

CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own preferences"
  ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
