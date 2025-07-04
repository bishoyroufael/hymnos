// Checks if there's not data in the content table
// or if table doesn't exist
export const IS_EMPTY_DATA = `
SELECT CASE
    WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'slides'
    )
    THEN (SELECT COUNT(*) FROM public.slides)
    ELSE 0
END AS row_count;
`;
