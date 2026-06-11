import type { components } from "@/db/models";
import type { PGliteWithLive } from "@electric-sql/pglite/live";

type HymnView = components["schemas"]["HymnView"];
type Hymn = components["schemas"]["Hymn"];

export type HymnsPagedResult = { items: Hymn[]; total: number };

/**
 * Get hymn by ID
 */
export async function getHymnById(db: PGliteWithLive, id: string): Promise<HymnView | undefined> {
  const results = await db.query("SELECT hymn FROM view_hymn_json WHERE hymn_id=$1;", [id]);
  if (results.rows.length === 0) {
    return undefined;
  }
  return (results.rows[0] as { hymn: HymnView }).hymn;
}

/**
 * Get paginated list of hymns ordered by name
 */
export async function getHymnsPaged(
  db: PGliteWithLive,
  page: number,
  pageSize: number
): Promise<HymnsPagedResult> {
  const offset = (page - 1) * pageSize;
  const [itemsResult, countResult] = await Promise.all([
    db.query<Hymn>(
      "SELECT id, name, author, composer FROM hymn ORDER BY name LIMIT $1 OFFSET $2",
      [pageSize, offset]
    ),
    db.query<{ total: string }>("SELECT COUNT(*) AS total FROM hymn"),
  ]);
  return {
    items: itemsResult.rows,
    total: parseInt(countResult.rows[0]?.total ?? "0", 10),
  };
}
