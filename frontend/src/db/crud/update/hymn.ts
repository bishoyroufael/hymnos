import type { PGliteWithLive } from "@electric-sql/pglite/live";

export async function updateHymn(
  db: PGliteWithLive,
  id: string,
  data: { name: string; author: string | null; composer: string | null }
): Promise<void> {
  await db.query(
    "UPDATE hymn SET name=$1, author=$2, composer=$3 WHERE id=$4",
    [data.name, data.author, data.composer, id]
  );
}
