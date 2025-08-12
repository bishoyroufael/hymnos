const SQL_HYMN_VIEW = `
CREATE OR REPLACE VIEW view_hymn_json AS
SELECT
  h.id AS hymn_id,
  json_build_object(
    'id', h.id,
    'name', h.name,
    'author', h.author,
    'composer', h.composer,
    'created_at', c.created_at,
    'tags', (
      SELECT json_agg(t.name)
      FROM tag_assignment ta
      JOIN tag t ON t.id = ta.tag_id
      WHERE ta.content_id = h.id AND ta.content_type = 'hymn'
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
                  'content_type', sc.content_type,
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
      WHERE s.content_id = h.id
    ), json_build_array())
  ) AS hymn
FROM hymn h
JOIN content c ON c.id = h.id;
`;

export default SQL_HYMN_VIEW;
