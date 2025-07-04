import { SQL_INIT_DIACRITIC } from "@db/commands/diacritic";
import SQL_GET_PACK_PAGED from "@db/commands/functions/get_pack_paged";
import SQL_INDICES from "@db/commands/indices";
import SQL_BIBLE_VIEW from "@db/commands/views/bible";
import SQL_LITURGY_VIEW from "@db/commands/views/liturgy";
import SQL_PACK_VIEW from "@db/commands/views/pack";
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
    CREATE TYPE content_type AS ENUM ('hymn', 'liturgy', 'bible');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================
-- 0. Diacritics
-- ===========================
${SQL_INIT_DIACRITIC}

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

-- Liturgy
CREATE TABLE IF NOT EXISTS liturgy (
    id UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS liturgy_block (
    id UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
    liturgy_id UUID REFERENCES liturgy(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    UNIQUE (liturgy_id, position)
);


-- Bible readings
CREATE TABLE IF NOT EXISTS bible (
    id UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    translation TEXT
);

-- ===========================
-- 4. Slides and Slide Columns
-- ===========================

CREATE TABLE IF NOT EXISTS slide (
    id UUID PRIMARY KEY,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    UNIQUE (content_id, position)
);

CREATE TABLE IF NOT EXISTS slide_column (
    id UUID PRIMARY KEY,
    slide_id UUID REFERENCES slide(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    content TEXT NOT NULL,
    header TEXT,
    UNIQUE (slide_id, position)
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

export const SQL_CREATE_INDEXES_VIEWS = `
${SQL_INDICES}
${SQL_SLIDE_VIEW}
${SQL_PACK_VIEW}
${SQL_LITURGY_VIEW}
${SQL_BIBLE_VIEW}
${SQL_GET_PACK_PAGED}
`;
