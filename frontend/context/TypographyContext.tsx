import { usePresentationFonts } from "@hooks/usePresentationFonts";
import { useRubikFonts } from "@hooks/useRubikFonts";
import { createContext, ReactNode } from "react";

type TypographyContextType = {
  fontsLoaded: boolean;
};

const TypographyContext = createContext<TypographyContextType | undefined>(
  undefined,
);

export const TypographyProvider = ({ children }: { children: ReactNode }) => {
  const rubikFontLoaded = useRubikFonts();
  const presentationFonts = usePresentationFonts();
  const fontsLoaded = rubikFontLoaded && presentationFonts;

  return (
    <TypographyContext.Provider value={{ fontsLoaded }}>
      {children}
    </TypographyContext.Provider>
  );
};
