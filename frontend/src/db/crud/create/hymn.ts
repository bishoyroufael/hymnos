import type { PGliteWithLive } from "@electric-sql/pglite/live";
import { ContentType } from "@/db/models";
import { uuidv7 } from "uuidv7";
import { insertInitialSlide } from "./slide";

export async function createHymn(
  db: PGliteWithLive,
  data: { name: string; author: string | null; composer: string | null }
): Promise<string> {
  const hymnId = uuidv7();
  await db.transaction(async (tx) => {
    await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [hymnId, ContentType.hymn]);
    await tx.query(
      "INSERT INTO hymn (id, name, author, composer) VALUES ($1, $2, $3, $4)",
      [hymnId, data.name, data.author, data.composer]
    );
    await insertInitialSlide(tx, hymnId, ContentType.hymn);
  });
  return hymnId;
}
