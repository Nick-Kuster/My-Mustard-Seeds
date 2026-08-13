-- CREATE OR REPLACE can't change a function's return-row shape (adding/
-- removing a column) — must drop first whenever RETURNS TABLE changes.
DROP FUNCTION IF EXISTS get_all_journal_entry_details(uuid);

CREATE OR REPLACE FUNCTION get_all_journal_entry_details(p_user_id UUID)
RETURNS TABLE (
   entry_data JSON,
   verses_data JSON,
   tags_data JSON,
   resources_data JSON,
   quotes_data JSON,
   links_data JSON,
   strongs_data JSON
) LANGUAGE plpgsql AS $$
BEGIN
   RETURN QUERY
   WITH journal_entries_base AS (
       SELECT je.id as entry_id
       FROM journal_entries je
       WHERE je.user_id = p_user_id
   ),
   entries_json AS (
       SELECT 
           je.id as entry_id,
           json_build_object(
               'id', je.id,
               'title', je.title,
               'type', je.type,
               'content', je.content,
               'is_favorite', COALESCE(je.is_favorite, false),
               'created_at', je.created_at,
               'updated_at', je.updated_at
           ) as entry_data
       FROM journal_entries je
       WHERE je.user_id = p_user_id
   ),
   verses_json AS (
       SELECT 
           jv.journal_id as entry_id,
           json_agg(
               json_build_object(
                   'start_verse_id', jv.start_verse_id,
                   'end_verse_id', jv.end_verse_id,
                   'main_verse', jv.main_verse,
                   'start_verse_number', start_bv.verse_number,
                   'start_verse', start_bv.verse,
                   'end_verse_number', end_bv.verse_number,
                   'end_verse', end_bv.verse,
                   'start_chapter', start_bv.chapter,
                   'end_chapter', end_bv.chapter,
                   'end_chapter_verse_count', bg.verse_count,
                   'book', start_bv.book
               )
           ) as verses_data
       FROM journal_verses jv
       JOIN bible_verses start_bv ON start_bv.id = jv.start_verse_id
       JOIN bible_verses end_bv ON end_bv.id = jv.end_verse_id
       LEFT JOIN bible_glossary bg ON bg.book = end_bv.book AND bg.chapter = end_bv.chapter
       GROUP BY jv.journal_id
   ),
   tags_json AS (
       SELECT 
           jt.journal_id as entry_id,
           json_agg(
               json_build_object(
                   'id', t.id,
                   'name', t.name
               )
           ) as tags_data
       FROM tags t
       JOIN journal_tags jt ON t.id = jt.tag_id
       GROUP BY jt.journal_id
   ),
   resources_json AS (
       SELECT 
           jr.journal_id as entry_id,
           json_agg(
               json_build_object(
                   'id', r.id,
                   'type', r.type,
                   'primary_resource', jr.primary_resource,
                   'metadata', r.metadata
               )
           ) as resources_data
       FROM resources r
       JOIN journal_resources jr ON r.id = jr.resource_id
       GROUP BY jr.journal_id
   ),
   quotes_json AS (
       SELECT 
           journal_id as entry_id,
           json_agg(
               json_build_object(
                   'id', id,
                   'quote', quote,
                   'source', source,
                   'page_number', page_number,
                   'created_at', created_at,
                   'updated_at', updated_at
               )
           ) as quotes_data
       FROM journal_quotes
       GROUP BY journal_id
   ),
   links_json AS (
       SELECT 
           journal_id as entry_id,
           json_agg(
               json_build_object(
                   'id', id,
                   'name', name,
                   'url', url,
                   'created_at', created_at,
                   'updated_at', updated_at
               )
           ) as links_data
       FROM related_links
       GROUP BY journal_id
   ),
   strongs_json AS (
       SELECT
           js.journal_id as entry_id,
           json_agg(
               json_build_object(
                   'id', js.id,
                   'strongs_number', js.strongs_number,
                   'language', se.language,
                   'lemma', se.lemma,
                   'transliteration', se.transliteration,
                   'pronunciation', se.pronunciation,
                   'derivation', se.derivation,
                   'strongs_def', se.strongs_def,
                   'kjv_def', se.kjv_def
               )
           ) as strongs_data
       FROM journal_strongs js
       JOIN strongs_entries se ON se.strongs_number = js.strongs_number
       GROUP BY js.journal_id
   )

   SELECT
       ej.entry_data,
       COALESCE(vj.verses_data, '[]'::json),
       COALESCE(tj.tags_data, '[]'::json),
       COALESCE(rj.resources_data, '[]'::json),
       COALESCE(qj.quotes_data, '[]'::json),
       COALESCE(lj.links_data, '[]'::json),
       COALESCE(sj.strongs_data, '[]'::json)
   FROM entries_json ej
   LEFT JOIN verses_json vj ON vj.entry_id = ej.entry_id
   LEFT JOIN tags_json tj ON tj.entry_id = ej.entry_id
   LEFT JOIN resources_json rj ON rj.entry_id = ej.entry_id
   LEFT JOIN quotes_json qj ON qj.entry_id = ej.entry_id
   LEFT JOIN links_json lj ON lj.entry_id = ej.entry_id
   LEFT JOIN strongs_json sj ON sj.entry_id = ej.entry_id
   ORDER BY (ej.entry_data->>'updated_at')::timestamp DESC;
END;
$$;
