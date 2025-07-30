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
  SQL_CREATE_VIEWS_FUNCTIONS,
  SQL_INITIAL_MIGRATIONS,
} from "@db/commands/migrations";
import { is_database_empty } from "@fractions/home-screen/handlers";
import { components as OPENAPI } from "@db/models";
import { SQL_INSERT_DIACRITIC_MAP } from "@db/commands/diacritic";
import { SQL_REMOVE_DIACRITICS } from "@db/commands/functions/remove_diacritics";
import { Asset } from "expo-asset";
import { import_tables_from_zip } from "@db/utils/import";

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
  const [hymnsAsset] = await Asset.loadAsync(
    require("../../assets/hymns_pglite_import.zip"),
  );
  const [biblesAsset] = await Asset.loadAsync(
    require("../../assets/bibles_pglite_import.zip"),
  );

  const hymnsTablesZipFile = await (await fetch(hymnsAsset.localUri!)).blob();
  const biblesTablesZipFile = await (await fetch(biblesAsset.localUri!)).blob();

  syncProgressCallback(25);
  await db.exec(SQL_INITIAL_MIGRATIONS);
  await db.exec(SQL_INSERT_DIACRITIC_MAP);
  await db.exec(SQL_REMOVE_DIACRITICS);

  // var s = performance.now();
  syncProgressCallback(50);
  await import_tables_from_zip(db, hymnsTablesZipFile, true);
  syncProgressCallback(75);
  await import_tables_from_zip(db, biblesTablesZipFile, true);
  await db.exec(SQL_CREATE_VIEWS_FUNCTIONS);
  // var e = performance.now();
  syncProgressCallback(90);
  await db.exec(SQL_CREATE_INDEXES_VIEWS);
  syncProgressCallback(100);
  // console.log(`Data import with Indexes took ${(e - s) / 1000}s`);
}
