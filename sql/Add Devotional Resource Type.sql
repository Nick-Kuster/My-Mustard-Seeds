-- Fix: "invalid input value for enum resource_type: Devotional", 2026-07-31.
-- Run in the Supabase SQL editor.
--
-- resources.type is backed by the resource_type Postgres enum (name is
-- right there in the error message). RESOURCE_TYPES.DEVOTIONAL
-- ('Devotional') has been used in the app code for a while (NewEntryPage,
-- EditEntryPage, resourceConfigs.js) but was apparently never added to the
-- live enum — same class of gap as 'Church' before it (see
-- "Church Hierarchy Migration.sql", section 0).

-- ============================================================
-- 1. Compare every RESOURCE_TYPES value (src/constants/resourceTypes.js)
--    against the live enum in one go, in case 'Devotional' isn't the only
--    one that's drifted. Any row with in_enum = false needs fixing.
-- ============================================================
WITH app_types(type_name) AS (
  VALUES ('Author'), ('Book'), ('Podcast'), ('PodcastEpisode'), ('Pastor'),
         ('SongArtist'), ('Church'), ('SermonSeries'), ('Sermon'), ('Chapter'),
         ('Show'), ('Season'), ('Episode'), ('Group'), ('Devotional')
)
SELECT
  app_types.type_name,
  EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'resource_type' AND e.enumlabel = app_types.type_name
  ) AS in_enum
FROM app_types
ORDER BY in_enum, app_types.type_name;

-- ============================================================
-- 2. Add it — must run as its own standalone statement (Postgres
--    disallows adding an enum value inside a transaction or DO block).
--    Just run this line by itself.
-- ============================================================
ALTER TYPE resource_type ADD VALUE 'Devotional';

-- If step 1 showed any other type with in_enum = false, add each the
-- same way, e.g.:
-- ALTER TYPE resource_type ADD VALUE 'SomeOtherType';
