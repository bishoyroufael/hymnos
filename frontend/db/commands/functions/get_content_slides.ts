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
    -- Build final result
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
                    'columns', (
                    SELECT json_agg(
                        json_build_object(
                        'id', sc.id,
                        'position', sc.position,
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
            WHERE s.content_id = get_content_slides.content_id
            ), json_build_array())
    );
    RETURN result;
END;
$$;
`;
