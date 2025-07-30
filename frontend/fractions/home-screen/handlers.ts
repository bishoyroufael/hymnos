import { IS_EMPTY_DATA } from "@db/commands/metadata";
import { SQL_TABLE_INFO } from "@db/commands/migrations";
import {
  get_all_packs,
  get_bible_chapter,
  get_content_using_id,
  get_hymn_using_id,
  get_hymns_using_ids,
} from "@db/crud/read";
import { ContentType } from "@db/models";
import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import { LastViewedCardDetails } from "@fractions/home-screen/types";

export const is_database_empty = async (db: PGlite) => {
  const res = await db.query(SQL_TABLE_INFO);
  // console.log("tables info: ", res);
  return res.rows.length == 0;
};

/**
 *
 * @param db PGLite instance
 * @param id id of a content in the db
 * This method is used for getting content details that will
 * be shown in the lastviewed cards in the homepage
 */
export const get_last_viewed_content_details = async (
  db: PGlite,
  id: string,
): Promise<LastViewedCardDetails> => {
  const content = await get_content_using_id(db, id);
  if (!content) {
    return null;
  }

  if (content.type == ContentType.bible_chapter) {
    const bible_chapter_details = await get_bible_chapter(db, id);
    return {
      id: id,
      name: bible_chapter_details.short_display_name,
      description: bible_chapter_details.bible.translation.name,
    };
  } else if (content.type == ContentType.hymn) {
    const hymn_details = await get_hymn_using_id(db, id);
    return {
      id: id,
      name: hymn_details.name,
      description: `المؤلف: ${hymn_details.author || "غير محدد"}\nالملحن: ${hymn_details.composer || "غير محدد"}`,
    };
  }

  return null;
  // todo: add else if for liturgy when ready
};
