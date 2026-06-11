/**
 * Diacritic handling for Arabic text search
 */

export const SQL_INIT_DIACRITIC = `
CREATE TABLE IF NOT EXISTS diacritic_map (
  diacritic TEXT PRIMARY KEY,   -- single Unicode character
  replacement TEXT              -- replacement character or ''
);`;

export const SQL_INSERT_DIACRITIC_MAP = `
INSERT INTO diacritic_map (diacritic, replacement) VALUES
-- Diacritic marks (remove these)
('ً', ''),  -- FATHATAN
('ٌ', ''),  -- DAMMATAN
('ٍ', ''),  -- KASRATAN
('َ', ''),  -- FATHA
('ُ', ''),  -- DAMMA
('ِ', ''),  -- KASRA
('ّ', ''),  -- SHADDA
('ْ', ''),  -- SUKUN
('ٓ', ''),  -- MADDAH
('ٔ', ''),  -- HAMZA ABOVE
('ٕ', ''),  -- HAMZA BELOW
('ـ', ''),  -- TATWEEL
-- Character normalization (replace these)
('أ', 'ا'),  -- ALEF WITH HAMZA ABOVE
('إ', 'ا'),  -- ALEF WITH HAMZA BELOW
('آ', 'ا'),  -- ALEF WITH MADDA ABOVE
('ة', 'ه'),  -- TEH MARBUTA
('ى', 'ي');  -- ALEF MAKSURA
`;
