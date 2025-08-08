import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import { ContentType, components as OPENAPI } from "@db/models";
import { parseBibleReference } from "@db/utils/string";
import { SearchResultsItem } from "@components/base/SearchResultsList";

type Hymn = OPENAPI["schemas"]["Hymn"];
type BibleBook = OPENAPI["schemas"]["BibleBook"];
type BibleChapter = OPENAPI["schemas"]["BibleChapter"];
type BibleChapterView = OPENAPI["schemas"]["BibleChapterView"];
type BibleBookView = OPENAPI["schemas"]["BibleBookView"];

export async function search_slide_columns(
  db: PGlite,
  query: string,
  contentTypes: ContentType[] = [ContentType.bible_chapter, ContentType.hymn],
) {
  // const s = performance.now();

  const idx_shared_str = `(coalesce(remove_diacritics(content), '') || ' ' ||
  coalesce(remove_diacritics(header), '')) 
  `;

  // Build individual queries for each content type
  const subQueries = contentTypes.map((contentType) => {
    let nameQuery: string;

    if (contentType === ContentType.hymn) {
      nameQuery = `(SELECT h.name FROM hymn h WHERE h.id = s.content_id)`;
    } else if (contentType === ContentType.bible_chapter) {
      nameQuery = `(SELECT CONCAT(bb.name_lang, ' ', bc.number, ': ', s.position + 1, ' (', bt.name, ')')
       FROM bible_chapter bc
       JOIN bible_book bb ON bc.bible_book_id = bb.id
       JOIN bible b ON bb.bible_id = b.id
       JOIN bible_translation bt ON b.translation_id = bt.id
       WHERE bc.id = s.content_id)`;
    } else {
      nameQuery = `NULL`;
    }

    return `(
  SELECT 
      sc.content,
      sc.slide_id,
      s.content_id,
      c.type,
      ${nameQuery} AS name,
      1 - (remove_diacritics($1) <-> ${idx_shared_str}) AS score
  FROM slide_column sc
  JOIN slide s ON sc.slide_id = s.id
  JOIN content c ON s.content_id = c.id
  WHERE 
      sc.content_type = '${contentType}'
      AND remove_diacritics($1) <% ${idx_shared_str}
      AND c.type = '${contentType}'
  ORDER BY remove_diacritics($1) <-> ${idx_shared_str}
  LIMIT 10
)`;
  });

  // Join all subqueries with UNION ALL
  // Build the full query
  let fullQuery: string;

  if (contentTypes.length === 1) {
    // Single content type - no UNION needed, no wrapping ORDER BY
    fullQuery = subQueries[0];
  } else {
    // Multiple content types - use UNION ALL with final ORDER BY
    fullQuery = `
${subQueries.join("\nUNION ALL\n")}
ORDER BY score DESC
LIMIT 10;
    `;
  }

  const results = await db.query(fullQuery, [query]);

  // const e = performance.now();
  // console.log(`Query search: ${(e - s) / 1000}s`);

  return results.rows as {
    content: string;
    slide_id: string;
    content_id: string;
    type: string;
    name: string;
    score: number;
  }[];
}

export async function search_bible(db: PGlite, query: string) {
  const idx_shared_str = `(coalesce(remove_diacritics(name_lang), '') || ' ' ||
  coalesce(remove_diacritics(name_lang_abbr), ''))`;

  const { book, bookNumber, chapter, verse } = parseBibleReference(query);
  const results = await db.query(
    `SELECT *,
      1 - (remove_diacritics($1) <-> ${idx_shared_str}) AS score
      FROM bible_book
      WHERE remove_diacritics($1) <%${idx_shared_str} 
      ORDER BY remove_diacritics($1) <->${idx_shared_str} 
      LIMIT 3;
      `,
    [book],
  );

  const books = results.rows as (BibleBook & { score: number })[];

  const search_results: SearchResultsItem[] = [];
  for (const book of books) {
    const res = await db.query(
      `SELECT bible_book from view_bible_book_json where id=$1`,
      [book.id],
    );
    const view = res.rows[0] as { bible_book: BibleBookView };
    const book_view = view.bible_book;
    const search_result: SearchResultsItem = {
      title: book_view.name_lang,
      subTitle: book_view.bible.translation.name,
      _resource_uuid: book_view.id,
      _resource_type: ContentType.bible_book,
      titleIconName: "book-open",
      subTitleIconName: "book",
      score: book.score,
    };

    // check if chapter number is valid i.e 1 <= chapter <= chapters_count
    if (chapter && chapter > 0 && chapter <= book_view.chapters_count) {
      const chapter_id = book_view.chapters[chapter - 1].id;
      const res = await db.query(
        `SELECT bible_chapter from view_bible_chapter_json where id=$1`,
        [chapter_id],
      );
      const view = res.rows[0] as { bible_chapter: BibleChapterView };
      const chapter_view = view.bible_chapter;
      search_result.title = `${book_view.name_lang} ${chapter}`;
      search_result._resource_uuid = chapter_id;
      search_result._resource_type = ContentType.bible_chapter;
      search_result._slide_uuid = chapter_view.slides[0].slide_id;
      // if verse number is specified in search term and is valid
      if (verse && verse > 0 && verse <= chapter_view.slides.length) {
        const verse_slide_id = chapter_view.slides[verse - 1].slide_id;
        const verse_content = chapter_view.slides[verse - 1].columns[0].content;
        search_result.titleIconName = "align-right";
        search_result.title = verse_content;
        search_result._slide_uuid = verse_slide_id;
        search_result.subTitle = `${book_view.name_lang} ${chapter}: ${verse} | ${book_view.bible.translation.name}`;
      }
    }
    search_results.push(search_result);
  }

  return search_results;
}

export async function search_hymn(db: PGlite, query: string) {
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
