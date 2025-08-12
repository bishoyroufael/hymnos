const SQL_BIBLE_VIEW = `
-- ===========================
-- Bible Views for JSON Output
-- ===========================

-- 1. Bible View with Translation Details and Book Count
CREATE OR REPLACE VIEW view_bible_json AS
SELECT 
    b.id,
    json_build_object(
        'id', b.id,
        'type', c.type,
        'created_at', c.created_at,
        'translation', json_build_object(
            'id', bt.id,
            'abbr', bt.abbr,
            'name', bt.name
        ),
        'books_count', COALESCE(book_stats.book_count, 0),
        'chapters_count', COALESCE(book_stats.total_chapters, 0)
    ) AS bible
FROM bible b
JOIN content c ON b.id = c.id
JOIN bible_translation bt ON b.translation_id = bt.id
LEFT JOIN (
    SELECT 
        bb.bible_id,
        COUNT(DISTINCT bb.id) as book_count,
        COUNT(DISTINCT bc.id) as total_chapters
    FROM bible_book bb
    LEFT JOIN bible_chapter bc ON bb.id = bc.bible_book_id
    GROUP BY bb.bible_id
) book_stats ON b.id = book_stats.bible_id;

-- 2. Bible Book View with Bible and Translation Details and Chapter Count
CREATE OR REPLACE VIEW view_bible_book_json AS
SELECT 
    bb.id,
    json_build_object(
        'id', bb.id,
        'type', c.type,
        'created_at', c.created_at,
        'canon_order', bb.canon_order,
        'name_id', bb.name_id,
        'name_lang', bb.name_lang,
        'name_lang_abbr', bb.name_lang_abbr,
        'bible', json_build_object(
            'id', b.id,
            'translation', json_build_object(
                'id', bt.id,
                'abbr', bt.abbr,
                'name', bt.name
            )
        ),
        'chapters_count', COALESCE(chapter_stats.chapter_count, 0),
        'chapters', COALESCE(chapter_stats.chapters, '[]'::json)
    ) AS bible_book
FROM bible_book bb
JOIN content c ON bb.id = c.id
JOIN bible b ON bb.bible_id = b.id
JOIN bible_translation bt ON b.translation_id = bt.id
LEFT JOIN (
    SELECT 
        bc.bible_book_id,
        COUNT(bc.id) as chapter_count,
        json_agg(
            json_build_object(
                'id', bc.id,
                'number', bc.number
            ) ORDER BY bc.number
        ) as chapters
    FROM bible_chapter bc
    GROUP BY bc.bible_book_id
) chapter_stats ON bb.id = chapter_stats.bible_book_id;

-- 3. Bible Chapter View with Full Hierarchy Details
CREATE OR REPLACE VIEW view_bible_chapter_json AS
SELECT 
    bc.id,
    json_build_object(
        'id', bc.id,
        'type', c.type,
        'created_at', c.created_at,
        'number', bc.number,
        'book', json_build_object(
            'id', bb.id,
            'name_id', bb.name_id,
            'name_lang', bb.name_lang,
            'name_lang_abbr', bb.name_lang_abbr
        ),
        'bible', json_build_object(
            'id', b.id,
            'translation', json_build_object(
                'id', bt.id,
                'abbr', bt.abbr,
                'name', bt.name
            )
        ),
        'slides', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'slide_id', s.id,
                    'position', s.position,
                    'columns', (
                    SELECT json_agg(
                        json_build_object(
                        'id', sc.id,
                        'position', sc.position,
                        'content_type', sc.content_type,
                        'header', sc.header,
                        'content', sc.content
                        ) ORDER BY sc.position
                    )
                    FROM slide_column sc
                    WHERE sc.slide_id = s.id
                    )
                )
                ORDER BY s.position
                )
            FROM slide s
            WHERE s.content_id = bc.id
            ), json_build_array()),
        'display_name', CONCAT(bb.name_lang, ' ', bc.number, ' (', bt.name, ')'),
        'short_display_name', CONCAT(bb.name_lang, ' ', bc.number)
    ) AS bible_chapter
FROM bible_chapter bc
JOIN content c ON bc.id = c.id
JOIN bible_book bb ON bc.bible_book_id = bb.id
JOIN bible b ON bb.bible_id = b.id
JOIN bible_translation bt ON b.translation_id = bt.id;
`;
export default SQL_BIBLE_VIEW;
