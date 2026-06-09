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
      WHERE s.content_id = h.id
    ), json_build_array())
  ) AS hymn
FROM hymn h
JOIN content c ON c.id = h.id;
`;

export default SQL_HYMN_VIEW;
