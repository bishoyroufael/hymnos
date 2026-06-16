// Returns a book's metadata plus a FLAT array of its nodes, pre-ordered (depth-first)
// so the array doubles as both the tree source (assemble via parent_id in TS) and the
// presentation reading order. Arbitrary-depth nesting is handled by the recursive walk;
// the JSON stays flat so we avoid a gnarly bottom-up nested-JSON CTE. Per-node slides are
// fetched separately via the generic get_content_slides(node_id).
export const SQL_GET_BOOK_TREE = `
CREATE OR REPLACE FUNCTION get_book_tree(p_book_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
WITH RECURSIVE ordered AS (
    SELECT id, parent_id, position, name, description, created_by,
           ARRAY[position] AS path, 1 AS depth
    FROM book_node
    WHERE book_id = p_book_id AND parent_id IS NULL
  UNION ALL
    SELECT c.id, c.parent_id, c.position, c.name, c.description, c.created_by,
           o.path || c.position, o.depth + 1
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
    'created_by', b.created_by,
    'nodes', COALESCE(
        (SELECT json_agg(
            json_build_object(
                'node_id', o.id,
                'parent_id', o.parent_id,
                'position', o.position,
                'depth', o.depth,
                'name', o.name,
                'description', o.description,
                'created_by', o.created_by,
                'slide_count', (SELECT COUNT(*) FROM slide WHERE content_id = o.id)
            )
            ORDER BY o.path -- path order == pre-order depth-first traversal
        )
        FROM ordered o
        ), '[]'::json
    )
) AS book
FROM book b
WHERE b.id = p_book_id;
$$;
`;

export default SQL_GET_BOOK_TREE;
