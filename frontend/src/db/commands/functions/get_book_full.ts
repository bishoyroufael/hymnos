// Full book load for the editor: book metadata + a FLAT, pre-ordered node list where
// each node carries its own slides (reusing get_content_slides). This is the single read
// behind the editor's local-state model — the whole book comes down in one query, all
// edits happen locally, and saveBookEdit writes the whole thing back.
export const SQL_GET_BOOK_FULL = `
CREATE OR REPLACE FUNCTION get_book_full(p_book_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
WITH RECURSIVE ordered AS (
    SELECT id, parent_id, position, name, description, ARRAY[position] AS path, 1 AS depth
    FROM book_node
    WHERE book_id = p_book_id AND parent_id IS NULL
  UNION ALL
    SELECT c.id, c.parent_id, c.position, c.name, c.description, o.path || c.position, o.depth + 1
    FROM book_node c
    JOIN ordered o ON c.parent_id = o.id
    WHERE c.book_id = p_book_id
)
SELECT json_build_object(
    'book_id', b.id,
    'name', b.name,
    'author', b.author,
    'description', b.description,
    'isbn', b.isbn,
    'nodes', COALESCE(
        (SELECT json_agg(
            json_build_object(
                'node_id', o.id,
                'parent_id', o.parent_id,
                'position', o.position,
                'name', o.name,
                'description', o.description,
                'slides', COALESCE(get_content_slides(o.id) -> 'slides', '[]'::json)
            )
            ORDER BY o.path
        )
        FROM ordered o
        ), '[]'::json
    )
) AS book
FROM book b
WHERE b.id = p_book_id;
$$;
`;

export default SQL_GET_BOOK_FULL;
