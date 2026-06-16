/**
 * Database migrations for PGlite
 * Contains SQL for creating tables, views, and functions
 */

import { SQL_INIT_DIACRITIC } from "@db/commands/diacritic";
import { SQL_GET_BIBLE_BOOKS_PAGED } from "@db/commands/functions/get_bible_books_paged";
import { SQL_GET_BIBLE_CHAPTERS_PAGED } from "@db/commands/functions/get_bible_chapters_paged";
import { SQL_GET_CONTENT_SLIDES } from "@db/commands/functions/get_content_slides";
import { SQL_GET_BOOK_TREE } from "@db/commands/functions/get_book_tree";
import { SQL_GET_BOOK_FULL } from "@db/commands/functions/get_book_full";
import SQL_GET_PACK_PAGED from "@db/commands/functions/get_pack_paged";
import SQL_BIBLE_VIEW from "@db/commands/views/bible";
import SQL_HYMN_VIEW from "@db/commands/views/pack";
import SQL_SLIDE_VIEW from "@db/commands/views/slide";

export const SQL_TABLE_INFO: string = `
SELECT 
  table_name,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int AS row_count
FROM (
  SELECT 
    table_name,
    query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I', table_name), false, true, '') AS xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
) AS counts;
`;

export const SQL_DELETE_ALL: string = `
drop schema public cascade;
create schema public;
`;

export const SQL_INITIAL_MIGRATIONS: string = `
DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('hymn', 'book', 'book_node', 'bible', 'bible_book', 'bible_chapter');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================
-- 0. Diacritics
-- ===========================
-- ${SQL_INIT_DIACRITIC}

-- ===========================
-- 1. Supertype Table
-- ===========================
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY,
    type content_type NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- 2. PACKS
-- ===========================
CREATE TABLE IF NOT EXISTS pack (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    author TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pack_item (
    pack_id UUID REFERENCES pack(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    PRIMARY KEY (pack_id, content_id)
);

-- ===========================
-- 3. Subtype Tables
-- ===========================

-- Hymns
CREATE TABLE IF NOT EXISTS hymn (
    id UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    author TEXT,
    composer TEXT
);

-- ===========================
-- Language Registry
-- ===========================

-- Language registry for all content (hymns, liturgy, slides, etc.)
CREATE TABLE IF NOT EXISTS language (
    id UUID PRIMARY KEY,
    language_code TEXT NOT NULL,
    variant TEXT,
    name TEXT NOT NULL,
    is_rtl BOOLEAN DEFAULT FALSE,
    UNIQUE (language_code, variant)
);

-- Book: Top-level book (e.g., "Divine Liturgy of St. Basil", "Agpeya")
CREATE TABLE IF NOT EXISTS book (
    id UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    author TEXT,
    description TEXT,
    isbn TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Book Node: a single self-referencing tree node, allowing a book to nest to any
-- depth (chapter -> section -> sub-section -> ...) instead of a fixed 2-level shape.
-- Slides attach to ANY node via slide.content_id -> content(id); a node may own both
-- its own slides AND child nodes. book_id is denormalized onto every node so the
-- owning book is one FK hop away (no recursive ancestry walk for search/export).
CREATE TABLE IF NOT EXISTS book_node (
    id UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES book(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES book_node(id) ON DELETE CASCADE, -- NULL = top-level node under the book
    position INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT book_node_no_self_parent CHECK (id <> parent_id),
    -- Siblings (same parent) are uniquely positioned. NULLS NOT DISTINCT makes
    -- top-level siblings (parent_id IS NULL) collide on duplicate positions within
    -- the same book, while different books stay independent via book_id.
    UNIQUE NULLS NOT DISTINCT (book_id, parent_id, position)
);

-- ===========================
-- Bible readings
-- ===========================
CREATE TABLE bible_translation (
    id TEXT PRIMARY KEY,
    abbr TEXT UNIQUE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL
);


CREATE TABLE IF NOT EXISTS bible (
    id UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
    translation_id TEXT NOT NULL REFERENCES bible_translation(id)
);


CREATE TABLE IF NOT EXISTS bible_book (
    id UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
    bible_id UUID REFERENCES bible(id) ON DELETE CASCADE,
    canon_order INTEGER NOT NULL,
    name_id TEXT NOT NULL,
    name_lang TEXT NOT NULL,
    name_lang_abbr TEXT,
    UNIQUE (bible_id, canon_order),
    UNIQUE (bible_id, name_id),
    UNIQUE (bible_id, name_lang),
    UNIQUE (name_lang, name_lang_abbr)
);


CREATE TABLE IF NOT EXISTS bible_chapter (
    id UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
    bible_book_id UUID REFERENCES bible_book(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    UNIQUE (bible_book_id, number)
);

-- ===========================
-- 4. Slides, Slide Rows, and Slide Columns
-- ===========================

CREATE TABLE IF NOT EXISTS slide (
    id UUID PRIMARY KEY,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    UNIQUE (content_id, position)
);

CREATE TABLE IF NOT EXISTS slide_row (
    id UUID PRIMARY KEY,
    slide_id UUID REFERENCES slide(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    columns INTEGER NOT NULL DEFAULT 1,
    UNIQUE (slide_id, position)
);

CREATE TABLE IF NOT EXISTS slide_column (
    id UUID PRIMARY KEY,
    row_id UUID REFERENCES slide_row(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    language_id UUID NOT NULL REFERENCES language(id),
    UNIQUE (row_id, position)
);

-- Rich content blocks within slide columns.
-- Block styling (semantic type, alignment, ...) is stored as JSONB in metadata,
-- e.g. {"type": "h1", "align": "center"}. This replaces the former block_type
-- enum column and is extensible without a schema migration.
CREATE TABLE IF NOT EXISTS slide_block (
    id UUID PRIMARY KEY,
    column_id UUID REFERENCES slide_column(id) ON DELETE CASCADE,
    content_type content_type NOT NULL, -- de-normalization for search index optimization
    position INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{"type": "paragraph"}'::jsonb,
    UNIQUE (column_id, position)
);

-- ===========================
-- 5. Tags
-- ===========================

CREATE TABLE IF NOT EXISTS tag (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS tag_assignment (
    tag_id UUID REFERENCES tag(id),
    content_id UUID NOT NULL,
    content_type content_type NOT NULL,
    PRIMARY KEY (tag_id, content_id, content_type)
);`;

export const SQL_CREATE_VIEWS_FUNCTIONS = `
${SQL_SLIDE_VIEW}
${SQL_HYMN_VIEW}
${SQL_BIBLE_VIEW}
${SQL_GET_BOOK_TREE}
${SQL_GET_PACK_PAGED}
${SQL_GET_BIBLE_BOOKS_PAGED}
${SQL_GET_BIBLE_CHAPTERS_PAGED}
${SQL_GET_CONTENT_SLIDES}
${SQL_GET_BOOK_FULL}
`;
