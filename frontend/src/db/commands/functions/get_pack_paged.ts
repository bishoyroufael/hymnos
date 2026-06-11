const SQL_GET_PACK_PAGED = `
CREATE OR REPLACE FUNCTION get_pack_json_paged_ultra_fast(
    pack_uuid UUID,
    page_number INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    pack_record RECORD;
    total_items INTEGER;
    offset_value INTEGER;
    total_pages INTEGER;
    items_json JSON;
BEGIN
    -- Validate inputs
    IF page_number < 1 THEN page_number := 1; END IF;
    IF page_size < 1 THEN page_size := 20; END IF;
    
    offset_value := (page_number - 1) * page_size;
    
    -- Get pack info and total count in one query
    SELECT p.*, pi_count.total_items
    INTO pack_record
    FROM pack p
    LEFT JOIN (
        SELECT pack_id, COUNT(*) as total_items
        FROM pack_item
        WHERE pack_id = pack_uuid
        GROUP BY pack_id
    ) pi_count ON pi_count.pack_id = p.id
    WHERE p.id = pack_uuid;
    
    -- Return null if pack doesn't exist
    IF pack_record.id IS NULL THEN
        RETURN NULL;
    END IF;
    
    total_items := COALESCE(pack_record.total_items, 0);
    total_pages := GREATEST(CEIL(total_items::DECIMAL / page_size::DECIMAL)::INTEGER, 1);
    
    -- Get paginated items with minimal JSON processing
    SELECT json_agg(
        json_build_object(
            'type', c.type,
            'id', c.id,
            'created_at', c.created_at,
            'content', 
            CASE c.type
                WHEN 'hymn' THEN json_build_object('name', h.name, 'author', h.author, 'composer', h.composer)
                WHEN 'book' THEN json_build_object('name', bk.name)
                WHEN 'bible_chapter' THEN json_build_object('name', CONCAT(bb.name_lang, ' ', bc.number))
                WHEN 'bible_book' THEN json_build_object('name', bb.name_lang)
            END
        )
        ORDER BY c.created_at
    )
    INTO items_json
    FROM (
        SELECT c.id, c.type, c.created_at
        FROM pack_item pi
        JOIN content c ON c.id = pi.content_id
        WHERE pi.pack_id = pack_uuid
        ORDER BY c.created_at
        LIMIT page_size
        OFFSET offset_value
    ) c
    LEFT JOIN hymn h ON h.id = c.id AND c.type = 'hymn'
    LEFT JOIN book bk ON bk.id = c.id AND c.type = 'book'
    LEFT JOIN bible_chapter bc ON bc.id = c.id AND c.type = 'bible_chapter'
    LEFT JOIN bible_book bb ON (bb.id = bc.bible_book_id AND c.type = 'bible_chapter')
                        OR (bb.id = c.id AND c.type = 'bible_book');
    
    RETURN json_build_object(
        'id', pack_record.id,
        'name', pack_record.name,
        'author', pack_record.author,
        'description', pack_record.description,
        'created_at', pack_record.created_at,
        'pagination', json_build_object(
            'current_page', page_number,
            'page_size', page_size,
            'total_items', total_items,
            'total_pages', total_pages,
            'min_page', 1,
            'max_page', total_pages,
            'has_next', (offset_value + page_size) < total_items,
            'has_previous', page_number > 1,
            'next_page', CASE WHEN (offset_value + page_size) < total_items THEN page_number + 1 ELSE NULL END,
            'previous_page', CASE WHEN page_number > 1 THEN page_number - 1 ELSE NULL END,
            'first_page', 1,
            'last_page', total_pages,
            'items_on_current_page', CASE
                WHEN total_items = 0 THEN 0
                WHEN page_number < total_pages THEN page_size
                ELSE total_items - offset_value
            END,
            'offset', offset_value,
            'is_first_page', page_number = 1,
            'is_last_page', page_number = total_pages OR total_items = 0
        ),
        'items', COALESCE(items_json, '[]'::json)
    );
END;
$$;
`;

export default SQL_GET_PACK_PAGED;
