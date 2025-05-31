import { get_all_packs } from "@db/dexie";
import { HymnsPack } from "@db/models";

export const updatePacks = async (
  setHymnPacks: React.Dispatch<React.SetStateAction<HymnsPack[]>>,
) => {
  const new_updated_packs = await get_all_packs();
  setHymnPacks(new_updated_packs);
};
