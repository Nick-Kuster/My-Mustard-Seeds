-- Church hierarchy migration, 2026-07-24.
-- Promotes Church to the top of the sermon hierarchy:
--   Church -> Pastor -> Sermon Series -> Sermon
-- Run each section in order in the Supabase SQL editor, after deploying
-- the client changes. All statements are idempotent (safe to re-run —
-- e.g. after creating new pastors through the old flow).

-- ============================================================
-- 0. PRE-CHECK: resources.type is an enum. Confirm 'Church' is a
--    member before anything else (it should be, since the app
--    defines it). If this returns no row, run the ALTER TYPE below.
-- ============================================================
SELECT e.enumlabel
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname = (
  SELECT udt_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'type'
)
AND e.enumlabel = 'Church';

-- Only if the check above returned nothing:
-- ALTER TYPE <enum_type_name> ADD VALUE 'Church';

-- ============================================================
-- 1. Create a Church resource for each distinct church name found
--    on pastors' metadata (per user), skipping ones that exist.
-- ============================================================
INSERT INTO public.resources (user_id, type, metadata)
SELECT DISTINCT ON (p.user_id, lower(trim(p.metadata->>'church')))
       p.user_id,
       'Church',
       jsonb_build_object('name', trim(p.metadata->>'church'))
FROM public.resources p
WHERE p.type = 'Pastor'
  AND coalesce(trim(p.metadata->>'church'), '') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.resources c
    WHERE c.type = 'Church'
      AND c.user_id = p.user_id
      AND lower(trim(c.metadata->>'name')) = lower(trim(p.metadata->>'church'))
  );

-- ============================================================
-- 2. Parent each pastor to its church (matched by name, per user).
--    relationship_type mirrors the app's convention (child type,
--    lowercased).
-- ============================================================
INSERT INTO public.resource_resources
    (parent_resource_id, child_resource_id, user_id, relationship_type)
SELECT c.id, p.id, p.user_id, 'pastor'
FROM public.resources p
JOIN public.resources c
  ON c.type = 'Church'
 AND c.user_id = p.user_id
 AND lower(trim(c.metadata->>'name')) = lower(trim(p.metadata->>'church'))
WHERE p.type = 'Pastor'
  AND coalesce(trim(p.metadata->>'church'), '') <> ''
ON CONFLICT (parent_resource_id, child_resource_id) DO NOTHING;

-- ============================================================
-- 3. Backfill existing sermon entries: link each entry that has a
--    pastor to that pastor's church.
--
--    NOTE: the journal_resources_set_user_id trigger overwrites
--    user_id with auth.uid(), which is NULL in the SQL editor —
--    so user triggers are suspended for this one insert.
--    (FK constraints are internal triggers and stay enforced.)
-- ============================================================
ALTER TABLE public.journal_resources DISABLE TRIGGER USER;

INSERT INTO public.journal_resources (journal_id, resource_id, user_id, primary_resource)
SELECT jr.journal_id, rr.parent_resource_id, jr.user_id, false
FROM public.journal_resources jr
JOIN public.resources p  ON p.id = jr.resource_id AND p.type = 'Pastor'
JOIN public.resource_resources rr ON rr.child_resource_id = p.id
JOIN public.resources c  ON c.id = rr.parent_resource_id AND c.type = 'Church'
ON CONFLICT (journal_id, resource_id) DO NOTHING;

ALTER TABLE public.journal_resources ENABLE TRIGGER USER;

-- ============================================================
-- 4. Sanity checks
-- ============================================================
-- Churches created:
SELECT metadata->>'name' AS church, count(*) OVER () AS total
FROM public.resources WHERE type = 'Church';

-- Pastors still without a church parent (had no church text):
SELECT p.metadata->>'name' AS pastor
FROM public.resources p
WHERE p.type = 'Pastor'
  AND NOT EXISTS (
    SELECT 1 FROM public.resource_resources rr
    JOIN public.resources c ON c.id = rr.parent_resource_id AND c.type = 'Church'
    WHERE rr.child_resource_id = p.id
  );
