import { getBibleChapter } from "@/db/crud/read/bible";
import { getContentById } from "@/db/crud/read/content";
import { getHymnById } from "@/db/crud/read/hymn";
import { getBook, getBookSection } from "@/db/crud/read/liturgy";
import { ContentType } from "@/db/models";
import type { PGliteWithLive } from "@electric-sql/pglite/live";

export interface LastViewedContentDetails {
  id: string;
  name: string;
  description: string;
  contentType: ContentType;
}

/**
 * Get content details for last viewed section
 * This method is used for getting content details that will
 * be shown in the recently viewed cards on the homepage
 */
export async function getLastViewedContentDetails(db: PGliteWithLive, id: string): Promise<LastViewedContentDetails | null> {
  const content = await getContentById(db, id);
  if (!content) {
    return null;
  }

  if (content.type === ContentType.bible_chapter) {
    const bibleChapterDetails = await getBibleChapter(db, id);
    if (!bibleChapterDetails) return null;

    return {
      id: id,
      name: bibleChapterDetails.short_display_name || `${bibleChapterDetails.book?.name_lang} ${bibleChapterDetails.number}`,
      description: bibleChapterDetails.bible?.translation?.name || "الكتاب المقدس",
      contentType: ContentType.bible_chapter,
    };
  } else if (content.type === ContentType.hymn) {
    const hymnDetails = await getHymnById(db, id);
    if (!hymnDetails) return null;

    return {
      id: id,
      name: hymnDetails.name || "ترنيمة",
      description:
        `${hymnDetails.author ? `المؤلف: ${hymnDetails.author}` : ""}${hymnDetails.composer ? ` • الملحن: ${hymnDetails.composer}` : ""}`.trim() ||
        "غير محدد",
      contentType: ContentType.hymn,
    };
  } else if (content.type === ContentType.book) {
    const bookDetails = await getBook(db, id);
    if (!bookDetails) return null;

    return {
      id: id,
      name: bookDetails.name || "كتاب",
      description: bookDetails.description || (bookDetails.author ? `المؤلف: ${bookDetails.author}` : "") || "كتاب",
      contentType: ContentType.book,
    };
  } else if (content.type === ContentType.book_section) {
    const sectionDetails = await getBookSection(db, id);
    if (!sectionDetails) return null;

    return {
      id: id,
      name: sectionDetails.name || "قسم",
      description: sectionDetails.description || sectionDetails.rubric || "صلاة",
      contentType: ContentType.book_section,
    };
  }

  return null;
}
