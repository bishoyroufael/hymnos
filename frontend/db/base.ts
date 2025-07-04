import { Dexie, type EntityTable } from "dexie";
import dexieObservable from "dexie-observable";
import dexieSyncable from "dexie-syncable";
import { Hymn, HymnsPack, Slide, Tag } from "./legacy_models";
import { create_hymns, create_slide } from "@db/hooks/create";
import { update_hymn, update_slide } from "@db/hooks/update";

// =============================================

export const SIZE_PER_PAGE = 10;
// Database declaration (move this to its own module also)
export const db = new Dexie("HymnosDB", {
  addons: [dexieObservable, dexieSyncable],
}) as Dexie & {
  hymns: EntityTable<Hymn, "uuid">;
  packs: EntityTable<HymnsPack, "uuid">;
  slides: EntityTable<Slide, "uuid">;
  tags: EntityTable<Tag, "uuid">;
};

export const DEXIE_VERSION = Dexie.version;

db.version(1).stores({
  hymns: "$$uuid",
  packs: "$$uuid",
  slides: "$$uuid, *searchWords",
  tags: "$$uuid",
});

db.version(2).stores({
  hymns: "$$uuid, *searchWords, tags",
  packs: "$$uuid",
  slides: "$$uuid, *searchWords",
  tags: "$$uuid",
});

// Hooks
db.slides.hook("creating", create_slide);
db.hymns.hook("creating", create_hymns);
db.slides.hook("updating", update_slide);
db.hymns.hook("updating", update_hymn);

/**
 * Checks if the database is empty by counting the number of hymns.
 * @returns A Promise that resolves to a boolean indicating whether the database is empty or not.
 */
export async function is_db_empty() {
  // for now we check if there's hymns
  const n = await db.hymns.count();
  return n == 0;
}
