import { components as OPENAPI } from "@db/models";

// type HymnView = OPENAPI["schemas"]["HymnView"];
// type BibleChapterView = OPENAPI["schemas"]["BibleChapterView"];


type ContentSlidesView = OPENAPI["schemas"]["ContentSlidesView"];

export interface AbstractData {
  viewObject: ContentSlidesView;
  viewObjectBackup: ContentSlidesView;
}
