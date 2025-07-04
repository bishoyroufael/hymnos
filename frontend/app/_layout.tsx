import HymnosPageWrapper from "@components/base/HymnosPageWrapper";
import { PGliteProvider } from "context/PGliteContext";
import { TypographyProvider } from "context/TypographyContext";
import { Slot, usePathname } from "expo-router";

export default function Layout() {
  const path = usePathname();
  const disableHeaderFooter = path.startsWith("/presentation");

  if (disableHeaderFooter) {
    return (
      <TypographyProvider>
        <PGliteProvider>
          <Slot />
        </PGliteProvider>
      </TypographyProvider>
    );
  }

  return (
    <TypographyProvider>
      <PGliteProvider>
        <HymnosPageWrapper>
          <Slot />
        </HymnosPageWrapper>
      </PGliteProvider>
    </TypographyProvider>
  );
}
