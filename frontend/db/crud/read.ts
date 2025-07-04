import { PGlite, Transaction } from "@electric-sql/pglite/dist/index.cjs";
import { components as OPENAPI } from "@db/models";

type Pack = OPENAPI["schemas"]["Pack"];
type PackView = OPENAPI["schemas"]["PackView"];
type HymnView = OPENAPI["schemas"]["HymnView"];

export async function get_all_packs(db: PGlite) {
  const res = await db.query(`
    SELECT * from "pack";
  `);
  return res.rows as Pack[];
}

export async function get_hymn_using_id(db: PGlite | Transaction, id: string) {
  const results = await db.query(
    "SELECT hymn FROM view_hymn_json WHERE hymn_id=$1;",
    [id],
  );
  if (results.rows.length == 0) {
    return undefined;
  }
  return (results.rows[0] as { hymn: HymnView }).hymn;
}

export async function get_hymns_using_ids(db: PGlite, ids: string[]) {
  const all_promises = ids.map(
    async (id) =>
      await db.query(
        `
      SELECT hymn from view_hymn_json WHERE hymn_id = $1 
      `,
        [id],
      ),
  );

  const results = await Promise.all(all_promises);
  const hymns = results.map((r) => (r.rows[0] as { hymn: HymnView }).hymn);
  return hymns;
}

export async function get_pack_using_id_paged(
  db: PGlite | Transaction,
  id: string,
  page: number = 1,
  page_size: number = 20,
) {
  const result = await db.query(`
    SELECT get_pack_json_paged_ultra_fast('${id}', ${page}, ${page_size});
  `);

  if (result.rows.length == 0) {
    return undefined;
  }
  return (result.rows[0] as { get_pack_json_paged_ultra_fast: PackView })
    .get_pack_json_paged_ultra_fast;
}
