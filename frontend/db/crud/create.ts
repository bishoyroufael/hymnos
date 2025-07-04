import { SQL_INITIAL_MIGRATIONS } from "@db/commands/migrations";

import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
export async function init_migrations(db: PGlite) {
  await db.exec(SQL_INITIAL_MIGRATIONS);
}

export async function create_hymn_safe(db: PGlite) {
  const r = await db.transaction((tx) => {
    const r = tx.query(``);
    return r;
  });
}

export async function create_pack_safe(db: PGlite) {
  const r = await db.transaction((tx) => {
    const r = tx.query(``);
    return r;
  });
}