import { ContentType, components as OPENAPI } from "@db/models";
type Slide = OPENAPI["schemas"]["Slide"];
type SlideColumn = OPENAPI["schemas"]["SlideColumn"];
type SlideView = OPENAPI["schemas"]["SlideView"];
import { randomUUID } from "expo-crypto";

export const createEmptySlide = (content_type = ContentType.hymn) => {
  const slideView: SlideView = {
    slide_id: randomUUID(),
    position: 0,
    columns: [
      {
        id: randomUUID(),
        position: 0,
        content_type: content_type,
        content: "",
        header: "",
      },
    ],
  };
  return slideView;
};
