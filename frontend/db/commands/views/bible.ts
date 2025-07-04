const SQL_BIBLE_VIEW = `
CREATE OR REPLACE VIEW view_bible_json AS
SELECT
    b.id AS bible_id,
    json_build_object(
        'bible_id', b.id,
        'reference', b.reference,
        'translation', b.translation,
        'slides', COALESCE(json_agg(
            json_build_object(
                'slide_id', vsj.slide_id,
                'position', vsj.slide->>'position',
                'columns', vsj.slide->'columns'
            ) ORDER BY vsj.slide->>'position'
        ) FILTER (WHERE vsj.slide_id IS NOT NULL), '[]'::json)
    ) AS bible
FROM bible b
LEFT JOIN slide s ON s.content_id = b.id
LEFT JOIN view_slide_json vsj ON vsj.slide_id = s.id
GROUP BY b.id, b.reference, b.translation;
`;
export default SQL_BIBLE_VIEW;
