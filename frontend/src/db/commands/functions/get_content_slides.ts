export const SQL_GET_CONTENT_SLIDES = `
CREATE OR REPLACE FUNCTION get_content_slides(
    content_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    -- Build final result with direct queries for performance
    result := json_build_object(
        'content_id', get_content_slides.content_id,
        'content_type', (
            SELECT c.type
            FROM content c
            WHERE c.id = get_content_slides.content_id
        ),
        'slides', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'slide_id', s.id,
                    'position', s.position,
                    'slide_rows', (
                        SELECT json_agg(
                            json_build_object(
                                'id', sr.id,
                                'position', sr.position,
                                'columns', sr.columns,
                                'slide_columns', (
                                    SELECT json_agg(
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
                                            'blocks', (
                                                SELECT json_agg(
                                                    json_build_object(
                                                        'id', sb.id,
                                                        'position', sb.position,
                                                        'content', sb.content,
                                                        'metadata', sb.metadata
                                                    ) ORDER BY sb.position
                                                )
                                                FROM slide_block sb
                                                WHERE sb.column_id = sc.id
                                            )
                                        ) ORDER BY sc.position
                                    )
                                    FROM slide_column sc
                                    WHERE sc.row_id = sr.id
                                )
                            ) ORDER BY sr.position
                        )
                        FROM slide_row sr
                        WHERE sr.slide_id = s.id
                    )
                )
                ORDER BY s.position
            )
            FROM slide s
            WHERE s.content_id = get_content_slides.content_id
        ), json_build_array())
    );
    RETURN result;
END;
$$;
`;
