import { useEffect, useState } from "react";
import {
  Extension,
  ExtensionSetupResult,
  PGlite,
  PGliteInterface,
} from "@electric-sql/pglite/dist/index.cjs";
import { Asset } from "expo-asset";

export const usePGlite = () => {
  const [db, setDb] = useState<PGlite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initPglite = async () => {
      try {
        const [wasmAsset, postgresDataAsset, pg_trgmAsset] =
          await Asset.loadAsync([
            require("../assets/pglite.wasm"),
            require("../assets/pglite.data"),
            require("../assets/pg_trgm.tar.gz"),
          ]);

        const fetchedWasm = await fetch(wasmAsset.localUri!);
        const fetchedFsBundle = await fetch(postgresDataAsset.localUri!);
        const pg_trgmBundle = await fetch(pg_trgmAsset.localUri!);

        const setup_pg_trgm = async (
          _pg: PGliteInterface,
          _emscriptenOpts: any,
        ) => {
          return {
            bundlePath: new URL(pg_trgmBundle.url),
          } satisfies ExtensionSetupResult;
        };

        const pg_trgm = {
          name: "pg_trgm",
          setup: setup_pg_trgm,
        } satisfies Extension;

        const wasmModule = await WebAssembly.compileStreaming(fetchedWasm);
        const client = new PGlite({
          // debug: 5,
          wasmModule,
          fsBundle: await fetchedFsBundle.blob(),
          dataDir: "idb://hymnos-pgdata",
          extensions: { pg_trgm },
          relaxedDurability: true,
        });
        await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
        await client.query("SET work_mem TO '16MB';");
        await client.query("SET pg_trgm.similarity_threshold = 0.4;");
        await client.query("SET maintenance_work_mem TO '1GB';");

        setDb(client);
      } catch (err) {
        console.log(err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    initPglite();
  }, []);

  return { db, loading, error };
};
