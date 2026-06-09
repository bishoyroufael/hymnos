/**
 * Database indices for performance optimization
 *
 * NOTE: A PRIMARY KEY / UNIQUE constraint already creates a B-tree index that
 * also serves leading-column lookups and ORDER BY on trailing columns. We
 * therefore only declare indexes NOT already covered by a constraint:
 *   - slide(content_id, position)      -> UNIQUE(content_id, position)
 *   - slide_row(slide_id, position)    -> UNIQUE(slide_id, position)
 *   - slide_column(row_id, position)   -> UNIQUE(row_id, position)
 *   - slide_block(column_id, position) -> UNIQUE(column_id, position)
 *   - pack_item(pack_id, content_id)   -> PRIMARY KEY(pack_id, content_id)
 *   - book_section(chapter_id, ...)    -> UNIQUE(chapter_id, position)
 *   - book_chapter_link(book_id, ...)  -> PK(book_id, chapter_id) + UNIQUE(book_id, position)
 * Redundant indexes are pure cost here: PGlite persists every index page into
 * IndexedDB, so they bloat startup load, writes, and storage footprint.
 */

export const SQL_INDICES = `
-- ===========================
-- 6. Indexes
-- ===========================

-- book_chapter_link: chapter_id is NOT the leading column of any constraint
-- (PK is (book_id, chapter_id)); needed for section/chapter joins in search.
CREATE INDEX IF NOT EXISTS idx_book_chapter_link_chapter
ON book_chapter_link(chapter_id);

-- tag_assignment: content lookups filter (content_id, content_type) but the PK
-- leads with tag_id, so neither is reachable. Covering index includes tag_id
-- for the join in the hymn/tag views.
CREATE INDEX IF NOT EXISTS idx_tag_assignment_content_type
ON tag_assignment(content_id, content_type, tag_id);

-- content: type is not covered by the (id) primary key; supports listing
-- content by type ordered by creation time.
CREATE INDEX IF NOT EXISTS idx_content_type_created_at
ON content(type, created_at, id);

-- ===========================
-- SEARCH PG_TRGM (GiST: required for <-> KNN ordering used by search)
-- Partial indexes on slide_block (content lives in blocks)
-- ===========================
CREATE INDEX IF NOT EXISTS trgm_idx_slide_block_hymn
ON slide_block
USING GIST (remove_diacritics(content) gist_trgm_ops)
WHERE content_type = 'hymn';

CREATE INDEX IF NOT EXISTS trgm_idx_slide_block_bible_chapter
ON slide_block
USING GIST (remove_diacritics(content) gist_trgm_ops)
WHERE content_type = 'bible_chapter';

CREATE INDEX IF NOT EXISTS trgm_idx_slide_block_book_section
ON slide_block
USING GIST (remove_diacritics(content) gist_trgm_ops)
WHERE content_type = 'book_section';

CREATE INDEX IF NOT EXISTS trgm_idx_hymn
ON hymn
USING GIST ((
  coalesce(remove_diacritics(name), '') || ' ' ||
  coalesce(remove_diacritics(author), '') || ' ' ||
  coalesce(remove_diacritics(composer), '')) gist_trgm_ops);

CREATE INDEX IF NOT EXISTS trgm_idx_bible_book
ON bible_book
USING GIST ((
  coalesce(remove_diacritics(name_lang), '') || ' ' ||
  coalesce(remove_diacritics(name_lang_abbr), '')) gist_trgm_ops);

CREATE INDEX IF NOT EXISTS trgm_idx_book
ON book
USING GIST ((
  coalesce(remove_diacritics(name), '') || ' ' ||
  coalesce(remove_diacritics(author), '') || ' ' ||
  coalesce(remove_diacritics(description), '')) gist_trgm_ops);

CREATE INDEX IF NOT EXISTS trgm_idx_book_chapter
ON book_chapter
USING GIST ((
  coalesce(remove_diacritics(name), '') || ' ' ||
  coalesce(remove_diacritics(description), '')) gist_trgm_ops);

CREATE INDEX IF NOT EXISTS trgm_idx_book_section
ON book_section
USING GIST ((
  coalesce(remove_diacritics(name), '') || ' ' ||
  coalesce(remove_diacritics(description), '') || ' ' ||
  coalesce(remove_diacritics(rubric), '')) gist_trgm_ops);
`;
