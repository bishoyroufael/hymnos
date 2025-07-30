export const SQL_GET_BIBLE_BOOKS_PAGED = `
-- ===========================
-- Paginated Bible Books Function
-- ===========================

CREATE OR REPLACE FUNCTION get_bible_books_paged(
    bible_id UUID,
    page_number INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    total_items INTEGER;
    total_pages INTEGER;
    offset_value INTEGER;
    current_page INTEGER;
    items_on_current_page INTEGER;
    books_data JSON;
    bible_data JSON;
    translation_data JSON;
    pagination_info JSON;
    result JSON;
BEGIN
     -- Validate inputs
    IF page_number < 1 THEN
        page_number := 1;
    END IF;
    
    IF page_size < 1 THEN
        page_size := 20;
    END IF;
    
    current_page := page_number;

    -- Get total count of books for this bible
    SELECT COUNT(*)
    INTO total_items
    FROM bible_book bb
    WHERE bb.bible_id = get_bible_books_paged.bible_id;

    -- Calculate pagination values
    total_pages := CASE 
        WHEN total_items = 0 THEN 1 
        ELSE CEIL(total_items::DECIMAL / page_size) 
    END;
    
    offset_value := (current_page - 1) * page_size;
    
    -- Ensure current_page doesn't exceed total_pages
    IF current_page > total_pages THEN
        current_page := total_pages;
        offset_value := (current_page - 1) * page_size;
    END IF;

    -- Get paginated books
    -- Get paginated books with proper ordering
    SELECT json_agg(row_to_json(bb_ordered.*))
    INTO books_data
    FROM (
        SELECT bb.*
        FROM bible_book bb
        WHERE bb.bible_id = get_bible_books_paged.bible_id
        ORDER BY bb.canon_order  -- Add ordering for consistent results
        LIMIT page_size
        OFFSET offset_value
    ) bb_ordered;

    -- Getting translation details
    SELECT row_to_json(bt.*)
    INTO translation_data
    FROM bible_translation bt 
    WHERE bt.id=(SELECT translation_id 
                FROM bible 
                WHERE id = get_bible_books_paged.bible_id);
    
    
    -- Embed bible data into result 
    SELECT row_to_json(b.*)
    INTO bible_data
    FROM bible b
    WHERE b.id = get_bible_books_paged.bible_id;


    -- Handle case where no books found
    IF books_data IS NULL THEN
        books_data := '[]'::json;
    END IF;
    
    -- Get actual count of items returned
    SELECT json_array_length(books_data) INTO items_on_current_page;
    
    -- Build pagination info
    pagination_info := json_build_object(
        'current_page', current_page,
        'page_size', page_size,
        'total_items', total_items,
        'total_pages', total_pages,
        'min_page', 1,
        'max_page', total_pages,
        'has_next', current_page < total_pages,
        'has_previous', current_page > 1,
        'next_page', CASE 
            WHEN current_page < total_pages THEN current_page + 1 
            ELSE NULL 
        END,
        'previous_page', CASE 
            WHEN current_page > 1 THEN current_page - 1 
            ELSE NULL 
        END,
        'first_page', 1,
        'last_page', total_pages,
        'items_on_current_page', items_on_current_page,
        'offset', offset_value,
        'is_first_page', current_page = 1,
        'is_last_page', current_page = total_pages
    );
    
    -- Build final result
    result := json_build_object(
        'items', books_data,
        'bible_data', bible_data,
        'translation_data', translation_data,
        'pagination', pagination_info
    );


    RETURN result;
END;
$$;
`;
