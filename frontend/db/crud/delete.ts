import { SQL_DELETE_ALL } from "@db/commands/migrations";
import { PGlite } from "@electric-sql/pglite/dist/index.cjs";

export async function delete_all(db: PGlite) {
  await db.exec(SQL_DELETE_ALL);
}

export async function delete_hymn_safe(db: PGlite, hymn_id: string) {
  await db.transaction(async (tx) => {
    await tx.query(`DELETE FROM content WHERE id=$1;`, [hymn_id]);
  });
}

export async function delete_pack_safe(db: PGlite, pack_id: string) {
  await db.transaction(async (tx) => {
    await tx.query(`DELETE FROM pack WHERE id=$1`, [pack_id]);
  });
}
