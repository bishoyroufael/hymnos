import { emitError, emitInfo, emitWarning } from "@utils/notification";
import * as fzstd from "fzstd";
import useHymnosState from "global";
import { useCallback } from "react";
import {
  insertContents,
  insertHymns,
  insertPackItems,
  insertPacks,
  insertSlideColumns,
  insertSlides,
} from "@db/utils/string";
import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import {
  SQL_CREATE_INDEXES_VIEWS,
  SQL_INITIAL_MIGRATIONS,
} from "@db/commands/migrations";
import { is_database_empty } from "@fractions/home-screen/handlers";
import { components as OPENAPI } from "@db/models";
import { SQL_INSERT_DIACRITIC_MAP } from "@db/commands/diacritic";
import { SQL_REMOVE_DIACRITICS } from "@db/commands/functions/remove_diacritics";

type Tables = OPENAPI["schemas"]["Tables"];

export function useFetchInitialData(db: PGlite) {
  // -reactive for passing to fetchDb, re-renders <ProgressBar/> only
  const syncProgressCallback =
    useHymnosState.getState().setSyncProgressPercentage; // non-reactive
  const setIsloadingData = useHymnosState.getState().setIsloadingData; // non-reactive
  const isloadingData = useHymnosState((state) => state.isloadingData); // updates if only isloadingData Changed

  return useCallback(() => {
    (async () => {
      if (!(await is_database_empty(db))) {
        setIsloadingData(false);
        return;
      }
      emitWarning("من فضلك انتظر، جاري تحميل البيانات");
      _import_from_assets(db, syncProgressCallback)
        .then(() => {
          emitInfo("تم تحميل المعلومات بنجاح");
        })
        .catch((e) => {
          emitError("لم يمكن الاتصال بالمعلومات، خطأ في الشبكه");
          console.log(e);
        })
        .finally(() => {
          setIsloadingData(false);
        });
    })();
  }, [isloadingData, db]);
}

async function _import_from_assets(
  db: PGlite,
  syncProgressCallback: (p: number) => void,
) {
  const response = await fetch(
    "/web_assets/b5ca3d5a-6ecd-4bcd-b278-9cacda44ab9f.json.zstd",
  );
  const compressed = new Uint8Array(await response.arrayBuffer());
  const decompressed = fzstd.decompress(compressed);
  const json: Tables = JSON.parse(new TextDecoder().decode(decompressed));
  const startTime = performance.now();
  // insert in tables
  const _insert_content_q = insertContents(json.contents);
  const _insert_hymns_q = insertHymns(json.hymns);
  const _insert_slides_q = insertSlides(json.slides);
  const _insert_slides_columns_q = insertSlideColumns(json.slide_columns);
  const _insert_packs_q = insertPacks(json.packs);
  const _insert_packs_items_q = insertPackItems(json.packs_items);
  // syncProgressCallback
  await db.exec(SQL_INITIAL_MIGRATIONS);
  await db.exec(SQL_INSERT_DIACRITIC_MAP);
  await db.exec(SQL_REMOVE_DIACRITICS);
  await db.exec(_insert_content_q);
  syncProgressCallback(25);
  await db.exec(_insert_hymns_q);
  syncProgressCallback(50);
  await db.exec(_insert_slides_q);
  syncProgressCallback(75);
  await db.exec(_insert_slides_columns_q);
  await db.exec(_insert_packs_q);
  await db.exec(_insert_packs_items_q);
  await db.exec(SQL_CREATE_INDEXES_VIEWS);
  syncProgressCallback(100);
  const endTime = performance.now();
  console.log(`Call to bulk import took ${endTime - startTime} milliseconds`);
}
