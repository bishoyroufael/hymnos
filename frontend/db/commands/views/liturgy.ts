const SQL_LITURGY_VIEW = `
CREATE OR REPLACE VIEW view_liturgy_json AS
SELECT
    l.id AS liturgy_id,
    json_build_object(
        'liturgy_id', l.id,
        'liturgy_name', l.name,
        'blocks', COALESCE(json_agg(
            json_build_object(
                'block_id', lb.id,
                'name', lb.name,
                'position', lb.position,
                'slides', COALESCE(vsj_block.slides, '[]'::json)
            )
            ORDER BY lb.position
        ) FILTER (WHERE lb.id IS NOT NULL), '[]'::json)
    ) AS liturgy
FROM liturgy l
LEFT JOIN liturgy_block lb ON lb.liturgy_id = l.id
-- For each block, collect its slides
LEFT JOIN (
    SELECT
        s.content_id AS block_id,
        json_agg(
            json_build_object(
                'slide_id', vsj.slide_id,
                'position', (vsj.slide->>'position')::int,
                'columns', vsj.slide->'columns'
            )
            ORDER BY (vsj.slide->>'position')::int
        ) AS slides
    FROM slide s
    JOIN view_slide_json vsj ON vsj.slide_id = s.id
    GROUP BY s.content_id
) vsj_block ON vsj_block.block_id = lb.id

GROUP BY l.id, l.name;
`;


export default SQL_LITURGY_VIEW;