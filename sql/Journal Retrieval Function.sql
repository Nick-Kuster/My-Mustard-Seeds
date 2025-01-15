CREATE OR REPLACE FUNCTION get_journal_entry_details(p_entry_id UUID, p_user_id UUID)
RETURNS TABLE (
    entry_data JSON,
    verses_data JSON,
    tags_data JSON,
    resources_data JSON,
    quotes_data JSON
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH entry_json AS (
        SELECT json_build_object(
            'id', je.id,
            'title', je.title,
            'type', je.type,
            'content', je.content,
            'created_at', je.created_at
        ) as entry_data
        FROM journal_entries je
        WHERE je.id = p_entry_id AND je.user_id = p_user_id
    ),
    verses_json AS (
        SELECT json_agg(json_build_object(
            'start_verse_id', jv.start_verse_id,
            'end_verse_id', jv.end_verse_id,
            'main_verse', jv.main_verse,
            'start_verse_number', start_bv.verse_number,
            'start_verse', start_bv.verse,
            'end_verse_number', end_bv.verse_number,
            'end_verse', end_bv.verse,
            'start_chapter', start_bv.chapter,
            'end_chapter', end_bv.chapter,
            'book', start_bv.book
        )) as verses_data
        FROM journal_verses jv
        JOIN bible_verses start_bv ON start_bv.id = jv.start_verse_id
        JOIN bible_verses end_bv ON end_bv.id = jv.end_verse_id
        WHERE jv.journal_id = p_entry_id
    ),
    tags_json AS (
        SELECT json_agg(json_build_object(
            'id', t.id,
            'name', t.name
        )) as tags_data
        FROM tags t
        JOIN journal_tags jt ON t.id = jt.tag_id
        WHERE jt.journal_id = p_entry_id
    ),
    resources_json AS (
        SELECT json_agg(json_build_object(
            'id', r.id,
            'type', r.type,
            'primary_resource', jr.primary_resource,
            'metadata', r.metadata
        )) as resources_data
        FROM resources r
        JOIN journal_resources jr ON r.id = jr.resource_id
        WHERE jr.journal_id = p_entry_id
    ),
    quotes_json AS (
        SELECT json_agg(json_build_object(
            'id', q.id,
            'quote', q.quote,
            'source', q.source,
            'page_number', q.page_number,
            'created_at', q.created_at,
            'updated_at', q.updated_at
        )) as quotes_data
        FROM journal_quotes q
        WHERE q.journal_id = p_entry_id
    )
    
    SELECT 
        entry_json.entry_data,
        COALESCE(verses_json.verses_data, '[]'::json),
        COALESCE(tags_json.tags_data, '[]'::json),
        COALESCE(resources_json.resources_data, '[]'::json),
        COALESCE(quotes_json.quotes_data, '[]'::json)
    FROM entry_json
    LEFT JOIN verses_json ON true
    LEFT JOIN tags_json ON true
    LEFT JOIN resources_json ON true
    LEFT JOIN quotes_json ON true;
END;
$$;