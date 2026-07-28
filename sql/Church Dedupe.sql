-- Church dedupe, 2026-07-24.
-- Merges duplicate Church resources that share the same normalized name
-- (per user), keeping the oldest row. Repoints pastor links and journal
-- links to the keeper, then deletes the duplicates. Idempotent.

-- ============================================================
-- 0. See what's there (ids, exact names, creation dates)
-- ============================================================
SELECT id, metadata->>'name' AS name, length(metadata->>'name') AS name_len, created_at
FROM public.resources
WHERE type = 'Church'
ORDER BY lower(trim(metadata->>'name')), created_at;

-- ============================================================
-- 1. Repoint pastor->church links from duplicates to the keeper
--    (skipping any that would collide with an existing link)
-- ============================================================
WITH ranked AS (
  SELECT id,
         first_value(id) OVER (
           PARTITION BY user_id, lower(trim(metadata->>'name'))
           ORDER BY created_at, id
         ) AS keeper_id
  FROM public.resources
  WHERE type = 'Church'
),
dupes AS (SELECT id, keeper_id FROM ranked WHERE id <> keeper_id)
UPDATE public.resource_resources rr
SET parent_resource_id = d.keeper_id
FROM dupes d
WHERE rr.parent_resource_id = d.id
  AND NOT EXISTS (
    SELECT 1 FROM public.resource_resources rr2
    WHERE rr2.parent_resource_id = d.keeper_id
      AND rr2.child_resource_id = rr.child_resource_id
  );

-- Remove any leftover links still pointing at a duplicate (collisions)
WITH ranked AS (
  SELECT id,
         first_value(id) OVER (
           PARTITION BY user_id, lower(trim(metadata->>'name'))
           ORDER BY created_at, id
         ) AS keeper_id
  FROM public.resources
  WHERE type = 'Church'
)
DELETE FROM public.resource_resources rr
USING ranked r
WHERE rr.parent_resource_id = r.id AND r.id <> r.keeper_id;

-- ============================================================
-- 2. Repoint journal links (trigger suspended: see Church
--    Hierarchy Migration step 3 for why)
-- ============================================================
ALTER TABLE public.journal_resources DISABLE TRIGGER USER;

WITH ranked AS (
  SELECT id,
         first_value(id) OVER (
           PARTITION BY user_id, lower(trim(metadata->>'name'))
           ORDER BY created_at, id
         ) AS keeper_id
  FROM public.resources
  WHERE type = 'Church'
),
dupes AS (SELECT id, keeper_id FROM ranked WHERE id <> keeper_id)
UPDATE public.journal_resources jr
SET resource_id = d.keeper_id
FROM dupes d
WHERE jr.resource_id = d.id
  AND NOT EXISTS (
    SELECT 1 FROM public.journal_resources jr2
    WHERE jr2.journal_id = jr.journal_id AND jr2.resource_id = d.keeper_id
  );

WITH ranked AS (
  SELECT id,
         first_value(id) OVER (
           PARTITION BY user_id, lower(trim(metadata->>'name'))
           ORDER BY created_at, id
         ) AS keeper_id
  FROM public.resources
  WHERE type = 'Church'
)
DELETE FROM public.journal_resources jr
USING ranked r
WHERE jr.resource_id = r.id AND r.id <> r.keeper_id;

ALTER TABLE public.journal_resources ENABLE TRIGGER USER;

-- ============================================================
-- 3. Delete the now-unreferenced duplicate churches
-- ============================================================
WITH ranked AS (
  SELECT id,
         first_value(id) OVER (
           PARTITION BY user_id, lower(trim(metadata->>'name'))
           ORDER BY created_at, id
         ) AS keeper_id
  FROM public.resources
  WHERE type = 'Church'
)
DELETE FROM public.resources res
USING ranked r
WHERE res.id = r.id AND r.id <> r.keeper_id;

-- ============================================================
-- 4. Verify: one row per church name
-- ============================================================
SELECT id, metadata->>'name' AS name FROM public.resources WHERE type = 'Church';
