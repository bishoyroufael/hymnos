export const SQL_INDICES = `
-- ===========================
-- 6. Indexes (Optional but Recommended)
-- ===========================

-- For faster joins / search
CREATE INDEX IF NOT EXISTS idx_slides_content_id ON slide(content_id);
CREATE INDEX IF NOT EXISTS idx_slide_columns_slide_id ON slide_column(slide_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignment_content_id ON tag_assignment(content_id);
CREATE INDEX IF NOT EXISTS idx_slide_position ON slide(content_id, position);
CREATE INDEX IF NOT EXISTS idx_column_position ON slide_column(slide_id, position);

-- SEARCH PG_TRGM
-- Create partial indexes
CREATE INDEX IF NOT EXISTS trgm_idx_slide_column_hymn
ON slide_column
USING GIST ((
  coalesce(remove_diacritics(content), '') || ' ' ||
  coalesce(remove_diacritics(header), '')) gist_trgm_ops )
WHERE content_type = 'hymn';

CREATE INDEX IF NOT EXISTS trgm_idx_slide_column_bible_chapter
ON slide_column
USING GIST ((
  coalesce(remove_diacritics(content), '') || ' ' ||
  coalesce(remove_diacritics(header), '')) gist_trgm_ops )
WHERE content_type = 'bible_chapter';

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


-- TO DO: think about other indices for bible and liturgy

-- Special (Claude)

-- Primary indexes for pack pagination
CREATE INDEX IF NOT EXISTS idx_pack_item_pack_id_created_at
ON pack_item(pack_id, content_id)
INCLUDE (content_id);

CREATE INDEX IF NOT EXISTS idx_content_id_type_created_at
ON content(id, type, created_at);

-- Indexes for efficient joins in JSON views
CREATE INDEX IF NOT EXISTS idx_slide_content_id_position
ON slide(content_id, position);

CREATE INDEX IF NOT EXISTS idx_tag_assignment_content_type
ON tag_assignment(content_id, content_type, tag_id);

CREATE INDEX IF NOT EXISTS idx_liturgy_block_liturgy_position
ON liturgy_block(liturgy_id, position);

-- Composite index for pack items with content ordering
CREATE INDEX IF NOT EXISTS idx_pack_content_ordering
ON pack_item(pack_id)
INCLUDE (content_id);

-- Index for content type filtering
CREATE INDEX IF NOT EXISTS idx_content_type_created_at
ON content(type, created_at, id);
`;
