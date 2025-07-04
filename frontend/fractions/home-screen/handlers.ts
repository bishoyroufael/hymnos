import { IS_EMPTY_DATA } from "@db/commands/metadata";
import { SQL_TABLE_INFO } from "@db/commands/migrations";
import { get_all_packs, get_hymns_using_ids } from "@db/crud/read";
import { PGlite } from "@electric-sql/pglite/dist/index.cjs";

export const getAllPacks = async (db: PGlite) => {
  const packs = await get_all_packs(db);
  return packs;
};

export const getHymnsUsingId = async (db: PGlite, ids: string[]) => {
  const hymns = await get_hymns_using_ids(db, ids);
  return hymns;
};

export const is_database_empty = async (db: PGlite) => {
  const res = await db.query(SQL_TABLE_INFO);
  // console.log("tables info: ", res);
  return res.rows.length == 0;
};
