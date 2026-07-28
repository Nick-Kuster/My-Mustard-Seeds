-- Manual church merge, 2026-07-24.
-- The name-matching dedupe script found no duplicates to merge even
-- though two "Mosaic Wadsworth" rows exist — likely a hidden character
-- difference (smart quote, non-breaking space, etc.) that trim()/lower()
-- didn't normalize away. This merges the two known-duplicate IDs directly,
-- no name comparison involved. Keeps whichever row is older.

DO $$
DECLARE
  id_a uuid := '80544d48-618a-4c21-adc8-76c7c732944b';
  id_b uuid := '0be688c4-8beb-4498-b1f4-1e4a05632f48';
  keeper uuid;
  dup uuid;
BEGIN
  SELECT id INTO keeper FROM public.resources WHERE id IN (id_a, id_b) ORDER BY created_at, id LIMIT 1;
  SELECT id INTO dup FROM public.resources WHERE id IN (id_a, id_b) AND id <> keeper;

  -- Repoint pastor -> church links from the duplicate to the keeper
  UPDATE public.resource_resources rr
  SET parent_resource_id = keeper
  WHERE rr.parent_resource_id = dup
    AND NOT EXISTS (
      SELECT 1 FROM public.resource_resources rr2
      WHERE rr2.parent_resource_id = keeper AND rr2.child_resource_id = rr.child_resource_id
    );
  DELETE FROM public.resource_resources WHERE parent_resource_id = dup;

  -- Repoint journal entry links (trigger suspended: see Church Hierarchy
  -- Migration step 3 for why — auth.uid() is NULL in the SQL editor)
  ALTER TABLE public.journal_resources DISABLE TRIGGER USER;

  UPDATE public.journal_resources jr
  SET resource_id = keeper
  WHERE jr.resource_id = dup
    AND NOT EXISTS (
      SELECT 1 FROM public.journal_resources jr2
      WHERE jr2.journal_id = jr.journal_id AND jr2.resource_id = keeper
    );
  DELETE FROM public.journal_resources WHERE resource_id = dup;

  ALTER TABLE public.journal_resources ENABLE TRIGGER USER;

  -- Remove the now-unreferenced duplicate
  DELETE FROM public.resources WHERE id = dup;

  RAISE NOTICE 'Kept %, merged and removed %', keeper, dup;
END $$;

-- Verify: should now show exactly one "Mosaic Wadsworth"
SELECT id, metadata->>'name' AS name FROM public.resources WHERE type = 'Church';
