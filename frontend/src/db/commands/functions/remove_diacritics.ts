export const SQL_REMOVE_DIACRITICS = `
CREATE OR REPLACE FUNCTION remove_diacritics(input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN translate(
    -- First remove diacritics
    translate(input,
      'ًٌٍَُِّْٰٖٜٟٗ٘ٙٚٛٝٞـ',
      ''
    ),
    -- Then normalize letter forms
    'آأإٱءةىي' ||        -- Alef variants, Hamza, Teh Marbuta, Yeh variants
    'ؤئ',               -- Waw/Yeh with Hamza
    'اااااهيي' ||        -- Normalized forms
    'وي'                -- Normalized Waw/Yeh
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
`;
