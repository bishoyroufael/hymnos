export const SQL_REMOVE_DIACRITICS = `
CREATE OR REPLACE FUNCTION remove_diacritics(input TEXT)
RETURNS TEXT AS $$
  SELECT regexp_replace(input, '[' ||
    string_agg(diacritic, '') ||
  ']', '', 'g')
  FROM public.diacritic_map;
$$ LANGUAGE SQL IMMUTABLE;
`;
