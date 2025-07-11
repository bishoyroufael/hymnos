import { useHymnosFonts } from "@hooks/useHymnosFonts";
import { createContext, ReactNode, useContext } from "react";

type TypographyContextType = {
  fontsLoaded: boolean;
};

const TypographyContext = createContext<TypographyContextType | undefined>(
  undefined,
);

export const TypographyProvider = ({ children }: { children: ReactNode }) => {
  const fontsLoaded = useHymnosFonts();

  return (
    <TypographyContext.Provider value={{ fontsLoaded }}>
      {children}
    </TypographyContext.Provider>
  );
};

export const useTypographyContext = (): TypographyContextType => {
  const context = useContext(TypographyContext);
  if (!context) {
    throw new Error(
      "useTypographyContext must be used within a TypographyProvider",
    );
  }
  return context;
};
