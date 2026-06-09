import type { components } from "../models";
import { ContentType } from "../models";
import type { PGliteWithLive } from "@electric-sql/pglite/live";
import { sortBy, uniqBy } from "lodash";
import type { SearchFilters } from "./search-types";

type Hymn = components["schemas"]["Hymn"];
type BibleBook = components["schemas"]["BibleBook"];

export interface SearchResultsItem {
  title: string;
  subTitle: string;
  subTitleIconName: string;
  titleIconName: string;
  _resource_uuid: string;
  _resource_type?: ContentType;
  _slide_uuid?: string;
  score: number;
}

/**
 * Search for slides across different content types
 */
export async function search_slide_rows(db: PGliteWithLive, query: string, contentTypes: ContentType[] = [ContentType.bible_chapter, ContentType.hymn]) {
  const idx_shared_str = `remove_diacritics(sb.content)`;

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
    } else if (contentType === ContentType.book_section) {
      nameQuery = `(SELECT CONCAT(b.name, ' - ', bc.name, ': ', bs_inner.name)
       FROM book_section bs_inner
       JOIN book_chapter bc ON bc.id = bs_inner.chapter_id
       JOIN book_chapter_link bcl ON bcl.chapter_id = bc.id
       JOIN book b ON b.id = bcl.book_id
       WHERE bs_inner.id = s.content_id)`;
    } else {
      nameQuery = `NULL`;
    }

    return `(
  SELECT
      sb.content,
      sr.slide_id,
      s.content_id,
      c.type,
      ${nameQuery} AS name,
      1 - (remove_diacritics($1) <-> ${idx_shared_str}) AS score
  FROM slide_block sb
  JOIN slide_column sc ON sb.column_id = sc.id
  JOIN slide_row sr ON sc.row_id = sr.id
  JOIN slide s ON sr.slide_id = s.id
  JOIN content c ON s.content_id = c.id
  WHERE
      sb.content_type = '${contentType}'
      AND remove_diacritics($1) <% ${idx_shared_str}
      AND c.type = '${contentType}'
  ORDER BY remove_diacritics($1) <-> ${idx_shared_str}
  LIMIT 10
)`;
  });

  // Join all subqueries with UNION ALL
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

  return results.rows as {
    content: string;
    slide_id: string;
    content_id: string;
    type: string;
    name: string;
    score: number;
  }[];
}

/**
 * Parse Bible reference like "متى 5:3" into components
 */
function parseBibleReference(query: string) {
  const parts = query.trim().split(/\s+/);
  const book = parts[0] || "";
  const bookNumber = 0;

  let chapter = 0;
  let verse = 0;

  if (parts.length > 1) {
    const ref = parts[1];
    const [chapterStr, verseStr] = ref.split(":");
    chapter = parseInt(chapterStr) || 0;
    verse = parseInt(verseStr) || 0;
  }

  return { book, bookNumber, chapter, verse };
}

/**
 * Search for Bible books and optionally chapters/verses
 *
 * Avoids the heavy view_bible_book_json / view_bible_chapter_json views (which
 * materialize every verse of a chapter as nested JSON). Instead it reads only
 * what each result needs via targeted, index-backed queries: ordered chapter
 * ids, ordered slide ids, and — only when a verse is requested — that one
 * verse's text.
 */
export async function search_bible(db: PGliteWithLive, query: string): Promise<SearchResultsItem[]> {
  const idx_shared_str = `(coalesce(remove_diacritics(name_lang), '') || ' ' ||
  coalesce(remove_diacritics(name_lang_abbr), ''))`;

  let { book, chapter, verse } = parseBibleReference(query);
  const results = await db.query(
    `SELECT *,
      1 - (remove_diacritics($1) <-> ${idx_shared_str}) AS score
      FROM bible_book
      WHERE remove_diacritics($1) <%${idx_shared_str}
      ORDER BY remove_diacritics($1) <->${idx_shared_str}
      LIMIT 3;
      `,
    [book]
  );

  const books = results.rows as (BibleBook & { score: number })[];

  const search_results: SearchResultsItem[] = [];
  for (const bookRow of books) {
    // Translation name + ordered chapter ids (replaces view_bible_book_json).
    // chapter_ids is ordered by chapter number, matching the view's `chapters`.
    const metaRes = await db.query<{ translation_name: string; chapter_ids: string[] | null }>(
      `SELECT bt.name AS translation_name,
        (SELECT json_agg(bc.id ORDER BY bc.number)
         FROM bible_chapter bc WHERE bc.bible_book_id = bb.id) AS chapter_ids
       FROM bible_book bb
       JOIN bible b ON bb.bible_id = b.id
       JOIN bible_translation bt ON b.translation_id = bt.id
       WHERE bb.id = $1;`,
      [bookRow.id]
    );
    const meta = metaRes.rows[0];
    if (!meta) continue;
    const chapterIds = meta.chapter_ids ?? [];

    const search_result: SearchResultsItem = {
      title: bookRow.name_lang,
      subTitle: meta.translation_name,
      _resource_uuid: bookRow.id,
      _resource_type: ContentType.bible_book,
      titleIconName: "book-open",
      subTitleIconName: "book",
      score: bookRow.score,
    };

    // check if chapter number is valid i.e 1 <= chapter <= chapters_count
    chapter = chapter && chapter > 0 && chapter <= chapterIds.length ? chapter : 1;
    const chapter_id = chapterIds[chapter - 1];
    if (!chapter_id) {
      search_results.push(search_result);
      continue;
    }

    // Ordered slide ids for the chapter (replaces view_bible_chapter_json).
    const slidesRes = await db.query<{ slide_ids: string[] | null }>(
      `SELECT json_agg(id ORDER BY position) AS slide_ids
       FROM slide WHERE content_id = $1;`,
      [chapter_id]
    );
    const slideIds = slidesRes.rows[0]?.slide_ids ?? [];

    search_result.title = `${bookRow.name_lang} ${chapter}`;
    search_result._resource_uuid = chapter_id;
    search_result._resource_type = ContentType.bible_chapter;
    search_result._slide_uuid = slideIds[0];

    // if verse number is specified in search term and is valid
    if (verse && verse > 0 && verse <= slideIds.length) {
      const verse_slide_id = slideIds[verse - 1];
      // Fetch only this verse's text: first column of the first row, preferring
      // a paragraph block over a header (mirrors the previous blocks[0] logic).
      const verseRes = await db.query<{ content: string }>(
        `WITH target_col AS (
           SELECT sc.id
           FROM slide_row sr
           JOIN slide_column sc ON sc.row_id = sr.id
           WHERE sr.slide_id = $1
           ORDER BY sr.position, sc.position
           LIMIT 1
         )
         SELECT COALESCE(
           (SELECT content FROM slide_block
             WHERE column_id = (SELECT id FROM target_col) AND metadata->>'type' = 'paragraph'
             ORDER BY position LIMIT 1),
           (SELECT content FROM slide_block
             WHERE column_id = (SELECT id FROM target_col)
             ORDER BY position LIMIT 1),
           ''
         ) AS content;`,
        [verse_slide_id]
      );
      const verse_content = verseRes.rows[0]?.content || "";
      search_result.titleIconName = "align-right";
      search_result.title = verse_content;
      search_result._slide_uuid = verse_slide_id;
      search_result.subTitle = `${bookRow.name_lang} ${chapter}: ${verse} | ${meta.translation_name}`;
    }

    search_results.push(search_result);
  }

  return search_results;
}

/**
 * Search for books by name, author, or description
 */
export async function search_book(db: PGliteWithLive, query: string) {
  type Book = components["schemas"]["Book"];
  const idx_shared_str = `(coalesce(remove_diacritics(name), '') || ' ' ||
  coalesce(remove_diacritics(author), '') || ' ' ||
  coalesce(remove_diacritics(description), ''))`;
  const results = await db.query(
    `SELECT id, name, author, description,
      1 - (remove_diacritics($1) <-> ${idx_shared_str}) AS score
      FROM book
      WHERE remove_diacritics($1) <% ${idx_shared_str}
      ORDER BY remove_diacritics($1) <-> ${idx_shared_str}
      LIMIT 20;`,
    [query]
  );
  return results.rows as (Book & { score: number })[];
}

/**
 * Search book metadata: book names/authors AND book section names.
 * Returns results already mapped to SearchResultsItem format.
 */
export async function search_book_metadata(db: PGliteWithLive, query: string): Promise<SearchResultsItem[]> {
  const [bookRows, sectionRows] = await Promise.all([
    search_book(db, query),
    db.query<{ section_id: string; section_name: string; chapter_name: string; book_name: string; score: number }>(
      `SELECT
        bs.id AS section_id,
        bs.name AS section_name,
        bc.name AS chapter_name,
        b.name AS book_name,
        1 - (remove_diacritics($1) <-> remove_diacritics(bs.name)) AS score
       FROM book_section bs
       JOIN book_chapter bc ON bc.id = bs.chapter_id
       JOIN book_chapter_link bcl ON bcl.chapter_id = bc.id
       JOIN book b ON b.id = bcl.book_id
       WHERE remove_diacritics($1) <% remove_diacritics(bs.name)
       ORDER BY remove_diacritics($1) <-> remove_diacritics(bs.name)
       LIMIT 10;`,
      [query]
    ),
  ]);

  const books: SearchResultsItem[] = bookRows.map((r) => ({
    title: r.name,
    subTitle: r.author || "غير محدد",
    _resource_uuid: r.id,
    _resource_type: ContentType.book,
    titleIconName: "book-open" as const,
    subTitleIconName: "user" as const,
    score: r.score,
  }));

  const sections: SearchResultsItem[] = sectionRows.rows.map((r) => ({
    title: r.section_name,
    subTitle: r.book_name + (r.chapter_name ? ` — ${r.chapter_name}` : ""),
    _resource_uuid: r.section_id,
    _resource_type: ContentType.book_section,
    titleIconName: "book-open" as const,
    subTitleIconName: "book" as const,
    score: r.score,
  }));

  return [...books, ...sections];
}

/**
 * Search for hymns by name, author, or composer
 */
export async function search_hymn(db: PGliteWithLive, query: string) {
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
    [query]
  );

  return results.rows as (Hymn & { score: number })[];
}

// Type definitions for search results
type SlideResult = {
  slide_id: string;
  content: string;
  name: string;
  content_id: string;
  type: string;
  score: number;
};

type HymnResult = Hymn & { score: number };

/**
 * Main search function that combines all search types based on granular filters
 *
 * @param db - PGlite database instance
 * @param searchWord - Search query string
 * @param filters - Granular search filter configuration
 * @returns Array of search results sorted by relevance score
 */
export async function runSearch(db: PGliteWithLive, searchWord: string, filters: SearchFilters): Promise<SearchResultsItem[]> {
  if (searchWord.trim().length === 0) return [];

  try {
    const promises: Promise<unknown>[] = [];
    const searchOperations: Array<keyof SearchFilters> = [];

    // 1. Search hymn metadata (name, author, composer)
    if (filters.hymnMetadata) {
      promises.push(search_hymn(db, searchWord));
      searchOperations.push("hymnMetadata");
    }

    // 2. Search hymn content (slide text/lyrics)
    if (filters.hymnContent) {
      promises.push(search_slide_rows(db, searchWord, [ContentType.hymn]));
      searchOperations.push("hymnContent");
    }

    // 3. Search bible references (book names, chapters)
    if (filters.bibleReference) {
      promises.push(search_bible(db, searchWord));
      searchOperations.push("bibleReference");
    }

    // 4. Search bible content (verse text)
    if (filters.bibleContent) {
      promises.push(search_slide_rows(db, searchWord, [ContentType.bible_chapter]));
      searchOperations.push("bibleContent");
    }

    // 5. Search book metadata (name, author, description) + section names
    if (filters.bookMetadata) {
      promises.push(search_book_metadata(db, searchWord));
      searchOperations.push("bookMetadata");
    }

    // 6. Search book section slide content
    if (filters.bookContent) {
      promises.push(search_slide_rows(db, searchWord, [ContentType.book_section]));
      searchOperations.push("bookContent");
    }

    // If no filters enabled, return empty
    if (promises.length === 0) return [];

    const results = await Promise.all(promises);

    // Process results based on search operation type
    const all_results: SearchResultsItem[] = [];

    for (let i = 0; i < searchOperations.length; i++) {
      const operation = searchOperations[i];
      const result = results[i];

      switch (operation) {
        case "hymnMetadata":
          // Hymn metadata search results
          all_results.push(
            ...(result as HymnResult[]).map((r) => ({
              title: r.name,
              subTitle: `${r.author || "غير محدد"} | ${r.composer || "غير محدد"}`,
              _resource_uuid: r.id,
              _resource_type: ContentType.hymn,
              titleIconName: "music" as const,
              subTitleIconName: "user" as const,
              score: r.score,
            }))
          );
          break;

        case "hymnContent":
          // Hymn slide content search results
          all_results.push(
            ...(result as SlideResult[]).map((r) => ({
              _slide_uuid: r.slide_id,
              title: r.content,
              subTitle: r.name,
              _resource_uuid: r.content_id,
              titleIconName: "align-right" as const,
              subTitleIconName: "music" as const,
              score: r.score,
            }))
          );
          break;

        case "bibleContent":
          // Bible verse content search results
          all_results.push(
            ...(result as SlideResult[]).map((r) => ({
              _slide_uuid: r.slide_id,
              title: r.content,
              subTitle: r.name,
              _resource_uuid: r.content_id,
              titleIconName: "align-right" as const,
              subTitleIconName: "book" as const,
              score: r.score,
            }))
          );
          break;

        case "bibleReference":
          // Bible reference search results (already properly formatted)
          all_results.push(...(result as SearchResultsItem[]));
          break;

        case "bookMetadata":
          // Results are already mapped to SearchResultsItem by search_book_metadata
          all_results.push(...(result as SearchResultsItem[]));
          break;

        case "bookContent":
          all_results.push(
            ...(result as SlideResult[]).map((r) => ({
              _slide_uuid: r.slide_id,
              title: r.content,
              subTitle: r.name,
              _resource_uuid: r.content_id,
              _resource_type: ContentType.book_section,
              titleIconName: "align-right" as const,
              subTitleIconName: "book-open" as const,
              score: r.score,
            }))
          );
          break;
      }
    }

    // Remove duplicates and sort by score
    // Unique values are needed since it can happen that
    // we get two results from the same chorus which gets repeated
    // in different places of the hymn
    const unique_results = sortBy(
      uniqBy(all_results, (item) => `${item.title}|${item.subTitle}`),
      (item) => 1 - item.score
    );

    return unique_results;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}
