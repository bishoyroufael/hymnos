const SQL_LITURGY_VIEW = `
-- Book view - returns structure without slide content
-- Slides should be fetched separately per section when needed
-- Books can contain chapters in multiple languages
CREATE OR REPLACE VIEW view_book_json AS
SELECT
    b.id AS book_id,
    json_build_object(
        'book_id', b.id,
        'name', b.name,
        'author', b.author,
        'description', b.description,
        'isbn', b.isbn,
        'created_by', b.created_by,
        'chapters', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'chapter_id', bc.id,
                    'position', bcl.position,
                    'name', bc.name,
                    'description', bc.description,
                    'created_by', bc.created_by,
                    'sections', COALESCE(
                        (SELECT json_agg(
                            json_build_object(
                                'section_id', bs.id,
                                'position', bs.position,
                                'name', bs.name,
                                'description', bs.description,
                                'rubric', bs.rubric,
                                'created_by', bs.created_by,
                                'slide_count', (SELECT COUNT(*) FROM slide WHERE content_id = bs.id)
                            )
                            ORDER BY bs.position
                        )
                        FROM book_section bs
                        WHERE bs.chapter_id = bc.id
                        ), '[]'::json
                    )
                )
                ORDER BY bcl.position
            )
            FROM book_chapter_link bcl
            JOIN book_chapter bc ON bcl.chapter_id = bc.id
            WHERE bcl.book_id = b.id
            ), '[]'::json
        )
    ) AS book
FROM book b;

-- View for book section with full slide data
-- Use this when you need the actual slide content
-- Language is inherited from parent chapter
CREATE OR REPLACE VIEW view_book_section_json AS
SELECT
    bs.id AS section_id,
    json_build_object(
        'section_id', bs.id,
        'position', bs.position,
        'name', bs.name,
        'description', bs.description,
        'rubric', bs.rubric,
        'created_by', bs.created_by,
        'slides', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'slide_id', s.id,
                    'position', s.position,
                    'slide_rows', COALESCE(
                        (SELECT json_agg(
                            json_build_object(
                                'id', sr.id,
                                'position', sr.position,
                                'columns', sr.columns,
                                'slide_columns', COALESCE(
                                    (SELECT json_agg(
                                        json_build_object(
                                            'id', sc.id,
                                            'position', sc.position,
                                            'language', (
                                                SELECT json_build_object(
                                                    'id', l.id,
                                                    'language_code', l.language_code,
                                                    'variant', l.variant,
                                                    'name', l.name,
                                                    'is_rtl', l.is_rtl
                                                )
                                                FROM language l
                                                WHERE l.id = sc.language_id
                                            ),
                                            'blocks', COALESCE(
                                                (SELECT json_agg(
                                                    json_build_object(
                                                        'id', sb.id,
                                                        'position', sb.position,
                                                        'content', sb.content,
                                                        'metadata', sb.metadata
                                                    ) ORDER BY sb.position
                                                )
                                                FROM slide_block sb
                                                WHERE sb.column_id = sc.id
                                                ), '[]'::json
                                            )
                                        )
                                        ORDER BY sc.position
                                    )
                                    FROM slide_column sc
                                    WHERE sc.row_id = sr.id
                                    ), '[]'::json
                                )
                            )
                            ORDER BY sr.position
                        )
                        FROM slide_row sr
                        WHERE sr.slide_id = s.id
                        ), '[]'::json
                    )
                )
                ORDER BY s.position
            )
            FROM slide s
            WHERE s.content_id = bs.id
            ), '[]'::json
        )
    ) AS section
FROM book_section bs;
`;


export default SQL_LITURGY_VIEW;
