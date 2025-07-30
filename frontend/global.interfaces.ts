import { PGlite } from "@electric-sql/pglite/dist/index.cjs";

export interface PresentationSettings {
  backgroundColor: string;
  fontColor: string;
  font: string;
  fontSize: number;
}

export interface HymnosState {
  isloadingData: boolean;
  importUserDataStatus: "idle" | "inprogress" | "done";
  lastViewedContent: string[];
  searchDebounceDelay: number;
  presentationSettings: PresentationSettings;
  setPresentationSettings: (
    newPresentationSettings: Partial<PresentationSettings>,
  ) => void;
  setLastViewedContent: (newLastViewedHymns: string[]) => void;
  setIsloadingData: (isFetching: boolean) => void;
  syncProgressPercentage: number;
  setSearchDebounceDelay: (delay: number) => void;
  setSyncProgressPercentage: (progress: number) => void;
  importUserData: (db: PGlite) => Promise<void>;
}
