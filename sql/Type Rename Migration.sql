-- Journal type rename, 2026-07-24.
-- Run once in the Supabase SQL editor after deploying the client changes.
--
-- 'Bible' is renamed to 'Daily Bible Reading' to distinguish casual
-- reading/meditation entries from the new 'Inductive Study' type.
-- 'Devotion' (a retired type with the same shape) is folded into it;
-- those entries simply have no main verse.

UPDATE public.journal_entries
SET type = 'Daily Bible Reading',
    updated_at = timezone('utc', now())
WHERE type IN ('Bible', 'Devotion');

-- Sanity check afterwards: should return no rows
SELECT id, title, type FROM public.journal_entries WHERE type IN ('Bible', 'Devotion');
