const SQL_SLIDE_VIEW = `
CREATE OR REPLACE VIEW view_slide_json AS
SELECT
    s.id AS slide_id,
    json_build_object(
        'slide_id', s.id,
        'position', s.position,
        'slide_rows', COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'id', sr.id,
                        'position', sr.position,
                        'columns', sr.columns,
                        'slide_columns', COALESCE(
                            (
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
                                        'blocks', COALESCE(
                                            (
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
                                            ),
                                            '[]'::json
                                        )
                                    ) ORDER BY sc.position
                                )
                                FROM slide_column sc
                                WHERE sc.row_id = sr.id
                            ),
                            '[]'::json
                        )
                    ) ORDER BY sr.position
                )
                FROM slide_row sr
                WHERE sr.slide_id = s.id
            ),
            '[]'::json
        )
    ) AS slide
FROM slide s;
`;

export default SQL_SLIDE_VIEW;
