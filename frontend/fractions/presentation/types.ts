import { components as OPENAPI } from "@db/models";

type HymnView = OPENAPI["schemas"]["HymnView"];

export interface AbstractData {
  viewObject: HymnView,
  viewObjectBackup: HymnView
}