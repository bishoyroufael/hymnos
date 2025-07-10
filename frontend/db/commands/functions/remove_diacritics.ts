// export const SQL_REMOVE_DIACRITICS = `
// CREATE OR REPLACE FUNCTION remove_diacritics(input TEXT)
// RETURNS TEXT AS $$
//   SELECT regexp_replace(input, '[' ||
//     string_agg(diacritic, '') ||
//   ']', '', 'g')
//   FROM public.diacritic_map;
// $$ LANGUAGE SQL IMMUTABLE;
// `;

export const SQL_REMOVE_DIACRITICS = `
CREATE OR REPLACE FUNCTION remove_diacritics(input TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT := input;
  rec RECORD;
BEGIN
  FOR rec IN SELECT diacritic, replacement FROM public.diacritic_map LOOP
    result := regexp_replace(result, rec.diacritic, rec.replacement, 'g');
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
`;
