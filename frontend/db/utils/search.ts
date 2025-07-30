import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import { components as OPENAPI } from "@db/models";

type Hymn = OPENAPI["schemas"]["Hymn"];

export async function search_slide_columns(db: PGlite, query: string) {
  // const start = performance.now();

  const idx_shared_str = `(coalesce(remove_diacritics(content), '') || ' ' ||
  coalesce(remove_diacritics(header), '')) 
  `;
  const results = await db.query(
    `
    SELECT 
    sc.content,
    sc.slide_id,
    s.content_id,
    c.type,
    CASE 
        WHEN c.type = 'bible_chapter' THEN CONCAT(bb.name_lang, ' ', bc.number, ': ', s.position + 1, ' (', bt.name, ')')
        WHEN c.type = 'hymn' THEN h.name
        ELSE NULL
    END AS name,
    1 - (remove_diacritics($1) <-> ${idx_shared_str}) AS score
    FROM slide_column sc
    JOIN slide s ON sc.slide_id = s.id
    JOIN content c ON s.content_id = c.id
    LEFT JOIN bible_chapter bc ON s.content_id = bc.id AND c.type = 'bible_chapter'
    LEFT JOIN bible_book bb ON bc.bible_book_id = bb.id
    LEFT JOIN bible b ON bb.bible_id = b.id
    LEFT JOIN bible_translation bt ON b.translation_id = bt.id
    LEFT JOIN hymn h ON s.content_id = h.id AND c.type = 'hymn'
    WHERE 
        remove_diacritics($1) <% ${idx_shared_str}
        AND c.type IN ('bible_chapter', 'hymn')
    ORDER BY remove_diacritics($1) <-> ${idx_shared_str}
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
    content_id: string;
    type: string;
    name: string;
    score: number;
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
      1 - (remove_diacritics($1) <-> ${idx_shared_str}) AS score
      FROM hymn
      WHERE remove_diacritics($1) <%${idx_shared_str} 
      ORDER BY remove_diacritics($1) <->${idx_shared_str} 
      LIMIT 10;
      `,
    [query],
  );

  return results.rows as (Hymn & { score: number })[];
}
