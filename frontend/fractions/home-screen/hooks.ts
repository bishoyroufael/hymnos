import {
  get_hymns_by_uuid,
  insert_hymns_and_packs,
  is_db_empty,
} from "@db/dexie";
import { Hymn, HymnsPack } from "@db/models";
import { updatePacks } from "@fractions/home-screen/handlers";
import { useGlobalLocalStorage } from "@hooks/useGlobalLocalStorage";
import { emitError, emitInfo, emitWarning } from "@utils/notification";
import { AxiosResponse } from "axios";
import * as fzstd from "fzstd";
import useHymnosState from "global";
import { useCallback } from "react";
import * as API from "../../generated/";

const HymnosAPI = new API.DefaultApi(
  new API.Configuration({ basePath: "http://localhost:8000" }),
);

export function useFetchInitialData(
  setHymnPacks: React.Dispatch<React.SetStateAction<HymnsPack[]>>,
  setLastViewedHymns: React.Dispatch<React.SetStateAction<Hymn[]>>,
  setIsFetchingFromRemote: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const lastViewedStorage = useGlobalLocalStorage<string[]>(
    "lastViewedHymns",
    [],
  );
  // non-reactive for passing to fetchDb, re-renders <ProgressBar/> only
  const syncProgressCallback =
    useHymnosState.getState().setSyncProgressPercentage;

  return useCallback(() => {
    (async () => {
      if (!(await is_db_empty())) {
        await updatePacks(setHymnPacks);
        // console.log(lastViewedStorage.get())
        const lastViewedHymnsUuids = lastViewedStorage.get();
        const lastViewedHymns = await get_hymns_by_uuid(lastViewedHymnsUuids);
        setLastViewedHymns(lastViewedHymns);
        return;
      }

      setIsFetchingFromRemote(true);
      emitWarning("من فضلك انتظر، جاري تحميل البيانات");
      _import_from_assets(syncProgressCallback).then(
        (packs) => {
          setHymnPacks(packs);
          setIsFetchingFromRemote(false);
          emitInfo("تم تحميل المعلومات بنجاح");
        },
        (r) => {
          emitError("لم يمكن الاتصال بالمعلومات، خطأ في الشبكه");
          setIsFetchingFromRemote(false);
          console.log(r);
        },
      );

      // _import_from_backend(syncProgressCallback).then(
      //   (packs) => {
      //     setHymnPacks(packs);
      //     setIsFetchingFromRemote(false);
      //     emitInfo("تم تحميل المعلومات بنجاح");
      //   },
      //   (r) => {
      //     emitError("لم يمكن الاتصال بالمعلومات، خطأ في الشبكه");
      //     setIsFetchingFromRemote(false);
      //     console.log(r);
      //   },
      // );
    })();
  }, [setHymnPacks, setLastViewedHymns, setIsFetchingFromRemote]);
}

async function _import_from_assets(syncProgressCallback: (p: number) => void) {
  const response = await fetch(
    "/web_assets/7d5003af-13f5-4148-bb04-fd4b5e342a9f.json.zstd",
  );
  const compressed = new Uint8Array(await response.arrayBuffer());
  const decompressed = fzstd.decompress(compressed);
  const json: API.HymnosItems = JSON.parse(
    new TextDecoder().decode(decompressed),
  );
  const startTime = performance.now();
  await insert_hymns_and_packs(
    json.hymns,
    json.packs,
    json.slides,
    1000,
    syncProgressCallback,
  );
  const endTime = performance.now();
  console.log(`Call to bulk import took ${endTime - startTime} milliseconds`);
  return json.packs;
}

async function _import_from_backend(syncProgressCallback: (p: number) => void) {
  return HymnosAPI.downloadLatestJsonDataLatestDownloadGet({
    responseType: "arraybuffer",
  }).then(async (res) => {
    const buffer: ArrayBuffer = (res as AxiosResponse<any, ArrayBuffer>).data;
    const compressed = new Uint8Array(buffer);
    const decompressed = fzstd.decompress(compressed);
    const json: API.HymnosItems = JSON.parse(
      new TextDecoder().decode(decompressed),
    );

    const startTime = performance.now();
    await insert_hymns_and_packs(
      json.hymns,
      json.packs,
      json.slides,
      1000,
      syncProgressCallback,
    );
    const endTime = performance.now();
    console.log(`Call to bulk import took ${endTime - startTime} milliseconds`);
    return json.packs;
  });
}
