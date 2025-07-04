const SQL_SLIDE_VIEW = `
CREATE OR REPLACE VIEW view_slide_json AS
SELECT
    s.id AS slide_id,
    json_build_object(
        'slide_id', s.id,
        'position', s.position,
        'columns', json_agg(
            json_build_object(
                'id', sc.id,
                'position', sc.position,
                'header', sc.header,
                'content', sc.content
            ) ORDER BY sc.position
        )
    ) AS slide
FROM slide s
JOIN slide_column sc ON sc.slide_id = s.id
GROUP BY s.id, s.position;
`;

export default SQL_SLIDE_VIEW;
