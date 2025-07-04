import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import { components as OPENAPI } from "@db/models";

type Hymn = OPENAPI["schemas"]["Hymn"];

export async function search_slide_columns(db: PGlite, query: string) {
  // const start = performance.now();

  const idx_shared_str = `(coalesce(remove_diacritics(content), '') || ' ' ||
  coalesce(remove_diacritics(header), '')) 
  `;
  const results = await db.query(
    `SELECT 
        sc.content,
        sc.slide_id,
        s.content_id,
        h.name AS hymn_name,
        h.id AS hymn_id,
      1 - ($1 <<-> ${idx_shared_str}) AS score
      FROM slide_column sc
      JOIN slide s ON sc.slide_id = s.id
      JOIN hymn h ON s.content_id = h.id
      WHERE $1 <%${idx_shared_str} 
      ORDER BY $1 <<->${idx_shared_str} 
      LIMIT 10;
      `,
    [query],
  );

  // const end = performance.now();
  // console.log(`Query search: ${(end - start) / 1000}s`);
  // console.log(results.rows);
  // return [];
  return results.rows as {
    content: string;
    slide_id: string;
    score: number;
    hymn_name: string;
    hymn_id: string;
  }[];
}

export async function search_hymn(db: PGlite, query: string) {
  // const results = await db.query(
  //   `SELECT * FROM hymn WHERE name || ' ' || author || ' ' || composer ILIKE %$1%`,
  //   [query],
  // );

  const idx_shared_str = `(coalesce(remove_diacritics(name), '') || ' ' ||
  coalesce(remove_diacritics(author), '') || ' ' ||
  coalesce(remove_diacritics(composer), ''))
  `;
  const results = await db.query(
    `SELECT *,
      1 - ($1 <<-> ${idx_shared_str}) AS score
      FROM hymn
      WHERE $1 <%${idx_shared_str} 
      ORDER BY $1 <<->${idx_shared_str} 
      LIMIT 10;
      `,
    [query],
  );

  return results.rows as (Hymn & { score: number })[];
}
