import { Hymn, HymnsPack, Slide } from "@db/models";

export interface MetaData {
    hymnos_version: string
    dexie_version: string
    user_agent: string
}

export interface HymnosDataExport {
    packs: HymnsPack []
    hymns: Hymn[]
    slides: Slide[]
    metadata: MetaData
}