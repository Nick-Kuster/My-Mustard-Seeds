-- Prayer requests: grouping and custom order, 2026-07-31.
-- Run in the Supabase SQL editor (after Prayer Requests Table.sql).
--
-- group_name is a flat, single-layer grouping — a prayer either belongs to
-- one freeform group or none (NULL). There's no separate groups table:
-- groups are just distinct group_name values, so creating/renaming/emptying
-- a group is purely a client-side concern with no schema management.
--
-- position gives each user a stable custom order (drag-to-reorder), backed
-- by an integer index re-sequenced on every reorder rather than fractional
-- indexing — simpler, and prayer-request lists are small enough that
-- rewriting positions on drag is cheap.

ALTER TABLE public.prayer_requests
  ADD COLUMN group_name text,
  ADD COLUMN position integer NOT NULL DEFAULT 0;

-- Backfill position so existing rows keep a stable order matching the
-- previous default sort (newest first), per user.
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1 AS rn
  FROM public.prayer_requests
)
UPDATE public.prayer_requests p
SET position = ordered.rn
FROM ordered
WHERE p.id = ordered.id;
