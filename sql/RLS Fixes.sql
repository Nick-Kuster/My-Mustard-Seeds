-- RLS fixes identified 2026-07-24.
-- Run each section in the Supabase SQL editor. Sections are independent.

-- ============================================================
-- 1. resource_resources: RLS is DISABLED.
--    Anyone with the anon key can currently read/write EVERY
--    user's resource relationships. Highest priority.
-- ============================================================
ALTER TABLE public.resource_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own resource relationships"
  ON public.resource_resources
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. bible_verses: RLS is DISABLED, so the existing
--    "publicly readable" policy has no effect and the table is
--    fully WRITABLE by anyone with the anon key.
--    Enabling RLS makes the existing SELECT policy take effect
--    and blocks all client writes. (Seeding via the service
--    role key or SQL editor still bypasses RLS.)
-- ============================================================
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. bible_glossary: same problem, and it has no policy at all.
-- ============================================================
ALTER TABLE public.bible_glossary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bible glossary is publicly readable"
  ON public.bible_glossary
  FOR SELECT
  USING (true);

-- ============================================================
-- 4. journal_resources.user_id is nullable, but its
--    SELECT/UPDATE/DELETE policies key on user_id — any row
--    with a NULL user_id is invisible and undeletable to its
--    owner. Backfill from the parent entry, then lock it down.
-- ============================================================
UPDATE public.journal_resources jr
SET user_id = je.user_id
FROM public.journal_entries je
WHERE jr.journal_id = je.id
  AND jr.user_id IS NULL;

ALTER TABLE public.journal_resources ALTER COLUMN user_id SET NOT NULL;

-- ============================================================
-- 5. DIAGNOSTIC (paste the result back): are the journal RPC
--    functions SECURITY DEFINER? If any row says DEFINER, that
--    function bypasses RLS and the p_user_id parameter lets any
--    logged-in user read someone else's entries.
-- ============================================================
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';
