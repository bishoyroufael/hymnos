// src/context/PGliteContext.tsx
import Loader from "@components/base/Loader";
import ProgressBar from "@components/base/ProgressBar";
import { PGlite } from "@electric-sql/pglite/dist/index.cjs";

import { useFetchInitialData } from "@fractions/home-screen/hooks";
import { usePGlite } from "@hooks/usePGlite";
import useHymnosState from "global";
import { createContext, ReactNode, useContext, useEffect } from "react";
import { ToastContainer } from "react-toastify";

import { components as OPENAPI } from "@db/models";

type Tables = OPENAPI["schemas"]["Tables"];
type PGliteContextType = {
  db: PGlite | null;
};

const PGliteContext = createContext<PGliteContextType | undefined>(undefined);

export const PGliteProvider = ({ children }: { children: ReactNode }) => {
  // error is neglected for now..
  const { db, loading, error } = usePGlite();
  const isloadingData = useHymnosState.getState().isloadingData;
  const fetchInitialData = useFetchInitialData(db);
  // Should run migrations if the database is empty initially
  // on all pages of the applications
  useEffect(() => {
    if (db) {
      fetchInitialData();
    }
  }, [db]);

  return (
    <PGliteContext.Provider value={{ db }}>
      {/* <Button title="Download SQL Statments" onPress={_dumpPG} /> */}
      <ToastContainer />
      {loading || isloadingData ? (
        <Loader progressComponent={<ProgressBar />} />
      ) : (
        children
      )}
    </PGliteContext.Provider>
  );
};

export const usePGliteContext = (): PGliteContextType => {
  const context = useContext(PGliteContext);
  if (!context) {
    throw new Error("usePGliteContext must be used within a PGliteProvider");
  }
  return context;
};
